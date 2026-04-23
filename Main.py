from asyncio.windows_events import NULL

from flask import Flask, render_template, send_from_directory, request, jsonify
from Eventit import GameSetup, Mission
import random

#tallentaa luodut yhteydet palvelimeen
connections = {}
app = Flask(__name__, template_folder='web_ui')

def get_conn():
    """Get the DB connection for the current session, reconnecting if needed."""
    session_id = request.headers.get("X-DB-Session")
    conn = connections.get(session_id)
    if not conn:
        return None
    try:
        conn.ping(reconnect=True)
    except Exception:
        return None
    return conn
@app.route('/flight_game_run')
def flight_game_run():
    return render_template("index.html")

#Route Javascriptille kun log in:iä painetaan Gamesetup luo yhteyden
@app.route("/api/db-login", methods=["POST"])
def db_login():
    data = request.get_json()
    user = data["user"]
    password = data["password"]

    conn = GameSetup.db_connection(user, password)
    session_id = user
    connections[session_id] = conn
    return jsonify({"session": session_id})

#Kerää kaikki savefilet sql:stä
@app.route("/api/saves", methods=["GET"])
def saves():
    conn = get_conn()
    if not conn:
        print("no connection")
        return jsonify({"error": "Session expired"}), 401
    cursor = conn.cursor()

    cursor.execute("""
        SELECT screen_name, money, co2_budget, co2_consumed
        FROM game
        WHERE screen_name IS NOT NULL
          AND screen_name != ''
        ORDER BY screen_name
    """)

    rows = cursor.fetchall()
    print(f"rows {rows}")

    saves = []
    for screen_name, money, co2_budget, co2_consumed in rows:
        saves.append({
            "pilot": screen_name,
            "money": int(money),
            "co2_remaining": int(co2_budget - co2_consumed),
        })

    return jsonify({"saves": saves})

#valitsee saven ja aloittaa pelin
@app.route("/api/game-state", methods=["GET"])
def game_state():
    conn = get_conn()
    if not conn:
        return jsonify({"error": "No session"}), 401

    player = request.args.get("player")

    cursor = conn.cursor()

    cursor.execute("""
                   SELECT money, co2_budget, co2_consumed, location, screen_name
                   FROM game
                   WHERE screen_name = %s
                   """, (player,))

    row = cursor.fetchone()

    if not row:
        return jsonify({"error": "Player not found"}), 404

    money, budget, consumed, location, screen_name = row

    cursor.execute("""
                   SELECT airport.name,
                          country.name,
                          airport.latitude_deg,
                          airport.longitude_deg
                   FROM airport
                            JOIN country ON airport.iso_country = country.iso_country
                   WHERE airport.ident = %s
                   """, (location,))

    airport_name, country_name, lat, lon = cursor.fetchone()

    return jsonify({
        "money": money,
        "co2_remaining": budget - consumed,
        "location_airport": airport_name,
        "location_country": country_name,
        "location_lat": float(lat),
        "location_lon": float(lon),
        "player": screen_name
    })
@app.route("/api/callMissions", methods=["GET"])
def callMissions():
    conn = get_conn()
    if not conn:
        print("no connection")
        return jsonify({"error": "Session expired"}), 401
    cursor = conn.cursor()
    missions = []

    for i in range(random.randint(5, 10)):
        newmission = Mission.GenerateMission(cursor)
        missions.append(newmission)
        print(missions[i]["Name"], i)

    print(jsonify({"missions": missions}))
    return jsonify({"missions": missions})

@app.route("/api/start-mission", methods=["POST"])
def start_mission():
    conn = get_conn()
    if not conn:
        return jsonify({"error": "Session expired"}), 401

    data = request.get_json()
    player = data.get("player")
    mission = data.get("mission")

    if not player or not mission:
        return jsonify({"error": "Missing player or mission data"}), 400

    cursor = conn.cursor()

    # Calculate payout: cargoAmount * payRate
    cargo_amount = mission.get("cargoAmount", 0)
    pay_rate = mission.get("payRate", 0)
    payout = int(cargo_amount) * int(pay_rate)

    # Get destination airport ident
    destination = mission.get("Destination", [])
    if not destination or len(destination[0]) < 5:
        return jsonify({"error": "Invalid mission destination", "debug": destination}), 400
    dest_ident = destination[0][4]  # airport ident is 5th element (index 4)

    # Calculate approximate CO2 based on distance (rough estimate: 0.25kg per km)
    origin = mission.get("Location", [])
    if origin and len(origin) > 0 and len(origin[0]) >= 4:
        orig_lat = float(origin[0][2])
        orig_lon = float(origin[0][3])
        dest_lat = float(destination[0][2])
        dest_lon = float(destination[0][3])
        lat_diff = abs(dest_lat - orig_lat)
        lon_diff = abs(dest_lon - orig_lon)
        distance_km = (lat_diff + lon_diff) * 111
        co2_used = int(distance_km * 0.25)
    else:
        co2_used = 100  # default fallback

    # Update player: add money, deduct CO2, update location
    cursor.execute("""
        UPDATE game
        SET money = money + %s,
            co2_consumed = co2_consumed + %s,
            location = %s
        WHERE screen_name = %s
    """, (payout, co2_used, dest_ident, player))
    conn.commit()

    # Get updated values to return
    cursor.execute("""
        SELECT money, co2_budget - co2_consumed as co2_remaining
        FROM game
        WHERE screen_name = %s
    """, (player,))
    row = cursor.fetchone()

    if not row:
        return jsonify({"error": "Player not found after update"}), 500

    return jsonify({
        "payout": payout,
        "money": int(row[0]),
        "co2_remaining": int(row[1])
    })
    
@app.route("/api/bases", methods=["GET"])
def bases():
    conn = get_conn()
    if not conn:
        return jsonify({"error": "Session expired"}), 401
    cursor = conn.cursor()
    player = request.args.get("player")
    cursor.execute("""
        SELECT hb.name, hb.continent, hb.latitude_deg, hb.longitude_deg, hb.ident, hb.plants
        FROM game_home_base ghb
        JOIN home_base hb ON ghb.base_ident = hb.ident
        WHERE ghb.game_id = (SELECT id FROM game WHERE screen_name = %s)
    """, (player,))
    rows = cursor.fetchall()
    bases = []
    for name, continent, lat, lon, ident, plants in rows:
        bases.append({
            "airport": name,
            "country": continent,
            "lat": float(lat),
            "lon": float(lon),
            "ident": ident,
            "plants": plants
        })
    return jsonify({"bases": bases})

@app.route("/api/randomEvent", methods=["GET"])
def randomEvent():
    type = request.args.get("type")
    id = request.args.get("id")

    text = "Tämä on testi eventti"
    button = {
        "label" : "vaihtoehto 1",
        "id" : 1
    }
    button2 = {
        "label": "vaihtoehto 2",
        "id": 2
    }
    buttons = [button, button2]
    event = {
        "text" : text,
        "buttons" : buttons
    }
    return jsonify({"event": event})
@app.route('/app.js')
def js():
    return send_from_directory('web_ui', 'app.js')

@app.route('/styles.css')
def css():
    return send_from_directory('web_ui', 'styles.css')

if __name__ == "__main__":
    app.run(debug=True)