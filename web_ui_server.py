import json
import math
import os
import random
import secrets
from http.server import HTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
from urllib.parse import parse_qs, urlparse

import mysql.connector


PROJECT_ROOT = Path(__file__).parent
WEB_ROOT = PROJECT_ROOT / "web_ui"
DB_SESSIONS = {}


def db_connection(config=None):
    config = config or {}
    return mysql.connector.connect(
        host=config.get("host", os.getenv("FG_DB_HOST", "localhost")),
        port=int(config.get("port", os.getenv("FG_DB_PORT", "3306"))),
        user=config.get("user", os.getenv("FG_DB_USER", "root")),
        password=config.get("password", os.getenv("FG_DB_PASSWORD", "")),
        database=config.get("database", os.getenv("FG_DB_NAME", "flight_game")),
        autocommit=True,
    )


def get_saves(cur):
    cur.execute(
        """
        SELECT screen_name, money, co2_budget, co2_consumed
        FROM game
        WHERE screen_name IS NOT NULL AND screen_name != ''
        ORDER BY screen_name
        """
    )
    saves = []
    for screen_name, money, co2_budget, co2_consumed in cur.fetchall():
        saves.append(
            {
                "pilot": screen_name,
                "money": int(money),
                "co2_remaining": int(co2_budget - co2_consumed),
            }
        )
    return saves


def ensure_player(cur, player):
    cur.execute("SELECT id FROM game WHERE screen_name = %s", (player,))
    row = cur.fetchone()
    if row:
        return int(row[0])

    cur.execute("INSERT INTO game (screen_name) VALUES (%s)", (player,))
    cur.execute(
        "UPDATE game SET location = 'EFHK', co2_budget = 10000, co2_consumed = 0, money = 1000 WHERE screen_name = %s",
        (player,),
    )
    cur.execute("SELECT id FROM game WHERE screen_name = %s", (player,))
    game_id = int(cur.fetchone()[0])
    cur.execute(
        "INSERT INTO game_home_base (game_id, base_ident) VALUES(%s, 'EFHK')",
        (game_id,),
    )
    cur.execute("INSERT INTO airplane (game_id) VALUES(%s)", (game_id,))
    cur.execute(
        "UPDATE airplane SET ruuma = 1, moottori = 1, istuinpaikat = 1 WHERE game_id = %s",
        (game_id,),
    )
    return game_id


def create_save(cur, pilot):
    cur.execute("SELECT id FROM game WHERE screen_name = %s", (pilot,))
    if cur.fetchone():
        raise ValueError("Save name already exists")
    ensure_player(cur, pilot)


def delete_save(cur, pilot):
    cur.execute("SELECT id FROM game WHERE screen_name = %s", (pilot,))
    row = cur.fetchone()
    if not row:
        raise ValueError("Save not found")

    # Keep related rows but hide the save from save list, matching old game behavior.
    cur.execute("UPDATE game SET screen_name = NULL WHERE id = %s", (int(row[0]),))


def get_game_state(cur, player):
    cur.execute(
        "SELECT money, co2_budget, co2_consumed, location FROM game WHERE screen_name = %s",
        (player,),
    )
    row = cur.fetchone()
    if not row:
        raise ValueError("Player not found")

    money, co2_budget, co2_consumed, location = row

    cur.execute(
        """
        SELECT airport.name, country.name, airport.latitude_deg, airport.longitude_deg
        FROM airport
        JOIN country ON airport.iso_country = country.iso_country
        WHERE airport.ident = %s
        """,
        (location,),
    )
    loc_row = cur.fetchone() or ("Unknown", "Unknown", 0.0, 0.0)

    return {
        "money": int(money),
        "co2_budget": int(co2_budget),
        "co2_consumed": int(co2_consumed),
        "co2_remaining": int(co2_budget - co2_consumed),
        "location_ident": location,
        "location_airport": loc_row[0],
        "location_country": loc_row[1],
        "location_lat": float(loc_row[2]),
        "location_lon": float(loc_row[3]),
    }


def pick_airport(cur, where_clause="1=1"):
    query = f"""
        SELECT airport.name, country.name, airport.latitude_deg, airport.longitude_deg, airport.ident
        FROM airport
        JOIN country ON airport.iso_country = country.iso_country
        WHERE airport.type != 'heliport' AND {where_clause}
        ORDER BY RAND()
        LIMIT 1
    """
    cur.execute(query)
    row = cur.fetchone()
    if not row:
        raise ValueError("No airports found for mission generation")
    return {
        "airport": row[0],
        "country": row[1],
        "lat": float(row[2]),
        "lon": float(row[3]),
        "ident": row[4],
    }


def generate_mission(cur):
    legal = random.choice([True, False])

    if legal:
        cargo = random.choice(["humans", "cargo"])
        from_airport = pick_airport(cur)
        to_airport = pick_airport(cur)
        if cargo == "humans":
            cargo_amount = random.randint(5, 100)
            pay_rate = random.randint(20, 100)
            name = f"{from_airport['country']} Passenger flight"
        else:
            cargo_amount = random.randint(20, 100)
            pay_rate = random.randint(5, 100)
            name = f"{from_airport['country']} Cargo flight"
    else:
        cargo = random.choice(["illegal humans", "tax free spices"])
        from_airport = pick_airport(
            cur,
            "(airport.continent = 'AF' OR airport.continent = 'SA' OR airport.iso_country = 'SY' OR airport.iso_country = 'AF')",
        )
        to_airport = pick_airport(
            cur,
            "(airport.continent = 'EU' OR airport.continent = 'NA' OR airport.iso_country = 'CN' OR airport.iso_country = 'IN')",
        )
        if cargo == "illegal humans":
            cargo_amount = random.randint(5, 100)
            pay_rate = random.randint(30, 150)
            name = f"{from_airport['country']} Donkey flight"
        else:
            cargo_amount = random.randint(20, 100)
            pay_rate = random.randint(8, 150)
            name = f"{from_airport['country']} Spice flight"

    return {
        "name": name,
        "legal": legal,
        "cargo": cargo,
        "cargoAmount": int(cargo_amount),
        "payRate": int(pay_rate),
        "from": from_airport,
        "to": to_airport,
    }


def haversine_km(lat1, lon1, lat2, lon2):
    r = 6371.0
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    d_phi = math.radians(lat2 - lat1)
    d_lambda = math.radians(lon2 - lon1)

    a = (
        math.sin(d_phi / 2) ** 2
        + math.cos(phi1) * math.cos(phi2) * (math.sin(d_lambda / 2) ** 2)
    )
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return r * c


def complete_mission(cur, player, mission):
    cur.execute(
        "SELECT g.location, a.ruuma, a.moottori, a.istuinpaikat FROM game g JOIN airplane a ON a.game_id = g.id WHERE g.screen_name = %s",
        (player,),
    )
    row = cur.fetchone()
    if not row:
        raise ValueError("Player game state not found")

    current_ident, ruuma, moottori, istuinpaikat = row

    cur.execute(
        "SELECT latitude_deg, longitude_deg FROM airport WHERE ident = %s",
        (current_ident,),
    )
    current_loc = cur.fetchone()
    if not current_loc:
        raise ValueError("Current location airport not found")

    from_lat = float(mission["from"]["lat"])
    from_lon = float(mission["from"]["lon"])
    to_lat = float(mission["to"]["lat"])
    to_lon = float(mission["to"]["lon"])

    leg1 = haversine_km(float(current_loc[0]), float(current_loc[1]), from_lat, from_lon)
    leg2 = haversine_km(from_lat, from_lon, to_lat, to_lon)

    fuel_multiplier = 5 / max(int(moottori), 1)
    co2_cost = int((leg1 / 25) * fuel_multiplier + (leg2 / 25) * fuel_multiplier)

    cargo_amount = int(mission["cargoAmount"])
    cargo_type = mission["cargo"]
    if cargo_type in ["humans", "illegal humans"]:
        cargo_amount = min(cargo_amount, int(istuinpaikat) * 20)
    else:
        cargo_amount = min(cargo_amount, int(ruuma) * 20)

    pay_rate = int(mission["payRate"])
    payout = pay_rate * cargo_amount - co2_cost

    cur.execute(
        "UPDATE game SET co2_consumed = co2_consumed + %s, money = money + %s, location = %s WHERE screen_name = %s",
        (co2_cost, payout, mission["to"]["ident"], player),
    )

    state = get_game_state(cur, player)
    return {
        "ok": True,
        "payout": int(payout),
        "co2_used": int(co2_cost),
        "money": state["money"],
        "co2_remaining": state["co2_remaining"],
    }


class GameRequestHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(WEB_ROOT), **kwargs)

    def _json_response(self, payload, status=200):
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _db_session_config(self):
        token = self.headers.get("X-DB-Session", "").strip()
        if not token:
            return None
        return DB_SESSIONS.get(token)

    def do_GET(self):
        parsed = urlparse(self.path)
        if parsed.path.startswith("/api/"):
            self.handle_api_get(parsed)
            return
        super().do_GET()

    def do_POST(self):
        parsed = urlparse(self.path)
        if parsed.path.startswith("/api/"):
            self.handle_api_post(parsed)
            return
        self._json_response({"error": "Not found"}, status=404)

    def handle_api_get(self, parsed):
        params = parse_qs(parsed.query)
        player = (params.get("player") or [""])[0].strip()
        db_config = self._db_session_config()

        if parsed.path in ["/api/game-state", "/api/missions"] and not player:
            self._json_response({"error": "Missing player query parameter"}, status=400)
            return

        if parsed.path in ["/api/saves", "/api/game-state", "/api/missions"] and not db_config:
            self._json_response({"error": "Missing or invalid DB session"}, status=401)
            return

        try:
            conn = db_connection(db_config)
            cur = conn.cursor()
            if player:
                ensure_player(cur, player)

            if parsed.path == "/api/saves":
                self._json_response({"saves": get_saves(cur)})
                return

            if parsed.path == "/api/game-state":
                self._json_response(get_game_state(cur, player))
                return

            if parsed.path == "/api/missions":
                count = int((params.get("count") or ["5"])[0])
                count = max(1, min(count, 10))
                missions = [generate_mission(cur) for _ in range(count)]
                self._json_response({"missions": missions})
                return

            if parsed.path == "/api/health":
                self._json_response({"ok": True})
                return

            self._json_response({"error": "Not found"}, status=404)
        except Exception as exc:
            self._json_response({"error": str(exc)}, status=500)
        finally:
            try:
                cur.close()
                conn.close()
            except Exception:
                pass

    def handle_api_post(self, parsed):
        try:
            content_length = int(self.headers.get("Content-Length", "0"))
            raw = self.rfile.read(content_length)
            payload = json.loads(raw.decode("utf-8") if raw else "{}")
        except Exception:
            self._json_response({"error": "Invalid JSON body"}, status=400)
            return

        if parsed.path == "/api/start-mission":
            player = str(payload.get("player", "")).strip()
            mission = payload.get("mission")
            db_config = self._db_session_config()
            if not player or not isinstance(mission, dict):
                self._json_response({"error": "Payload must include player and mission"}, status=400)
                return
            if not db_config:
                self._json_response({"error": "Missing or invalid DB session"}, status=401)
                return

            try:
                conn = db_connection(db_config)
                cur = conn.cursor()
                ensure_player(cur, player)
                result = complete_mission(cur, player, mission)
                self._json_response(result)
            except Exception as exc:
                self._json_response({"error": str(exc)}, status=500)
            finally:
                try:
                    cur.close()
                    conn.close()
                except Exception:
                    pass
            return

        if parsed.path == "/api/create-save":
            db_config = self._db_session_config()
            pilot = str(payload.get("pilot", "")).strip()
            if not db_config:
                self._json_response({"error": "Missing or invalid DB session"}, status=401)
                return
            if not pilot:
                self._json_response({"error": "pilot is required"}, status=400)
                return

            try:
                conn = db_connection(db_config)
                cur = conn.cursor()
                create_save(cur, pilot)
                state = get_game_state(cur, pilot)
                self._json_response({
                    "ok": True,
                    "pilot": pilot,
                    "money": state["money"],
                    "co2_remaining": state["co2_remaining"],
                })
            except Exception as exc:
                self._json_response({"error": str(exc)}, status=400)
            finally:
                try:
                    cur.close()
                    conn.close()
                except Exception:
                    pass
            return

        if parsed.path == "/api/delete-save":
            db_config = self._db_session_config()
            pilot = str(payload.get("pilot", "")).strip()
            if not db_config:
                self._json_response({"error": "Missing or invalid DB session"}, status=401)
                return
            if not pilot:
                self._json_response({"error": "pilot is required"}, status=400)
                return

            try:
                conn = db_connection(db_config)
                cur = conn.cursor()
                delete_save(cur, pilot)
                self._json_response({"ok": True, "pilot": pilot})
            except Exception as exc:
                self._json_response({"error": str(exc)}, status=400)
            finally:
                try:
                    cur.close()
                    conn.close()
                except Exception:
                    pass
            return

        if parsed.path == "/api/db-login":
            host = str(payload.get("host", "")).strip()
            user = str(payload.get("user", "")).strip()
            password = str(payload.get("password", ""))
            database = str(payload.get("database", "")).strip()
            port = payload.get("port", 3306)

            if not host or not user or not database:
                self._json_response({"error": "host, user and database are required"}, status=400)
                return

            try:
                config = {
                    "host": host,
                    "port": int(port),
                    "user": user,
                    "password": password,
                    "database": database,
                }
                conn = db_connection(config)
                cur = conn.cursor()
                cur.execute("SELECT 1")

                token = secrets.token_urlsafe(24)
                DB_SESSIONS[token] = config
                self._json_response({"ok": True, "session": token})
            except Exception as exc:
                self._json_response({"error": str(exc)}, status=401)
            finally:
                try:
                    cur.close()
                    conn.close()
                except Exception:
                    pass
            return

        self._json_response({"error": "Not found"}, status=404)


def run_server():
    host = os.getenv("FG_HOST", "0.0.0.0")
    port = int(os.getenv("PORT", os.getenv("FG_PORT", "8080")))
    print(f"Serving Flight Game UI + API at http://{host}:{port}")
    print("Set FG_DB_USER and FG_DB_PASSWORD environment variables before launch.")
    HTTPServer((host, port), GameRequestHandler).serve_forever()


if __name__ == "__main__":
    run_server()
