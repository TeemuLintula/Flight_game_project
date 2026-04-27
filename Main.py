from asyncio.windows_events import NULL
import random

from flask import Flask, render_template, send_from_directory, request, jsonify
from Eventit import GameSetup, Mission
from Eventit.random_eventit import airport_eventit, duringflight_eventit, Homebase_eventit

#tallentaa luodut yhteydet palvelimeen
connections = {}
app = Flask(__name__, template_folder='web_ui')

# ============================================================
# PLAYER CLASS - Backend representation of player state
# ============================================================
class Player:
    def __init__(self, name, conn):
        self.name = name
        self.conn = conn
        self.location = None
        self.bases = []
        self.money = 0
        self.co2_remaining = 0
    
    def load_game_state(self):
        """Load player's current game state from database"""
        cursor = self.conn.cursor()
        cursor.execute("""
            SELECT money, co2_budget, co2_consumed, location, screen_name
            FROM game WHERE screen_name = %s
        """, (self.name,))
        
        row = cursor.fetchone()
        if not row:
            raise ValueError(f"Player {self.name} not found")
        
        money, budget, consumed, location, screen_name = row
        self.money = money
        self.co2_remaining = budget - consumed
        
        cursor.execute("""
            SELECT airport.name,
                   country.name,
                   airport.latitude_deg,
                   airport.longitude_deg,
                   airport.ident
            FROM airport
            JOIN country ON airport.iso_country = country.iso_country
            WHERE airport.ident = %s
        """, (location,))
        
        airport_data = cursor.fetchone()
        if airport_data:
            airport_name, country_name, lat, lon, ident = airport_data
            self.location = {
                "airport": airport_name,
                "country": country_name,
                "lat": float(lat),
                "lon": float(lon),
                "ident": ident
            }
    
    def load_bases(self):
        """Load all owned bases for this player"""
        cursor = self.conn.cursor()
        cursor.execute("""
            SELECT hb.name, hb.continent, hb.latitude_deg, hb.longitude_deg, hb.ident
            FROM game_home_base ghb
            JOIN home_base hb ON ghb.base_ident = hb.ident
            WHERE ghb.game_id = (SELECT id FROM game WHERE screen_name = %s)
        """, (self.name,))
        
        rows = cursor.fetchall()
        self.bases = [
            {
                "airport": name,
                "country": continent,
                "lat": float(lat),
                "lon": float(lon),
                "ident": ident,
            }
            for name, continent, lat, lon, ident in rows
        ]
    
    def is_at_homebase(self):
        """Check if player's current location is one of their bases"""
        if not self.location or not self.bases:
            return False
        return any(base["ident"] == self.location["ident"] for base in self.bases)
    
    def get_selected_base(self):
        """Get the base player is currently at"""
        if not self.location:
            return None
        return next((b for b in self.bases if b["airport"] == self.location["airport"]), None)

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

    player_obj = Player(request.args.get("player"), conn)
    
    try:
        player_obj.load_game_state()
    except ValueError as e:
        return jsonify({"error": str(e)}), 404

    return jsonify({
        "money": player_obj.money,
        "co2_remaining": player_obj.co2_remaining,
        "location_airport": player_obj.location["airport"],
        "location_country": player_obj.location["country"],
        "location_lat": player_obj.location["lat"],
        "location_lon": player_obj.location["lon"],
        "location_ident": player_obj.location["ident"],
        "player": player_obj.name
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
    
    player_obj = Player(request.args.get("player"), conn)
    
    try:
        player_obj.load_bases()
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
    return jsonify({"bases": player_obj.bases})

@app.route("/api/start-homebase", methods=["POST"])
def start_homebase():
    conn = get_conn()
    if not conn:
        return jsonify({"error": "Session expired"}), 401

    data = request.get_json()
    player = data.get("player")
    base = data.get("base")

    if not player or not base:
        return jsonify({"error": "Missing player or base data"}), 400

    dest_ident = base.get("ident")
    if not dest_ident:
        return jsonify({"error": "Invalid base data"}), 400

    cursor = conn.cursor()
    cursor.execute("""
        SELECT location
        FROM game
        WHERE screen_name = %s
    """, (player,))
    row = cursor.fetchone()
    if not row:
        return jsonify({"error": "Player not found"}), 404

    origin_ident = row[0]

    cursor.execute("""
        SELECT latitude_deg, longitude_deg
        FROM airport
        WHERE ident = %s
    """, (origin_ident,))
    origin_row = cursor.fetchone()
    if not origin_row:
        return jsonify({"error": "Origin airport not found"}), 404

    cursor.execute("""
        SELECT latitude_deg, longitude_deg
        FROM airport
        WHERE ident = %s
    """, (dest_ident,))
    dest_row = cursor.fetchone()
    if not dest_row:
        return jsonify({"error": "Destination airport not found"}), 404

    orig_lat, orig_lon = map(float, origin_row)
    dest_lat, dest_lon = map(float, dest_row)
    distance_km = (abs(dest_lat - orig_lat) + abs(dest_lon - orig_lon)) * 111
    co2_used = int(distance_km * 0.25)

    cursor.execute("""
        UPDATE game
        SET co2_consumed = co2_consumed + %s,
            location = %s
        WHERE screen_name = %s
    """, (co2_used, dest_ident, player))
    conn.commit()

    cursor.execute("""
        SELECT money, co2_budget - co2_consumed as co2_remaining
        FROM game
        WHERE screen_name = %s
    """, (player,))
    row = cursor.fetchone()
    if not row:
        return jsonify({"error": "Player not found after update"}), 500

    return jsonify({
        "money": int(row[0]),
        "co2_remaining": int(row[1])
    })

# Placeholder kasveja varten
@app.route("/api/check-plants", methods=["GET"])
def check_plants():
    conn = get_conn()
    if not conn:
        return jsonify({"error": "Session expired"}), 401

    base_ident = request.args.get("base")
    plants = request.args.get("plants")
    player = request.args.get("player")

    if not base_ident or not player:
        return jsonify({"error": "Missing base or player"}), 400

    cursor = conn.cursor()
    cursor.execute("""
        SELECT ghb.plants, ghb.base_ident, ghb.game_id
        FROM game_home_base ghb
        JOIN game g ON ghb.game_id = g.id
        WHERE ghb.base_ident = %s AND g.screen_name = %s
    """, (base_ident, player))

    row = cursor.fetchone()
    if not row:
        return jsonify({"error": "Base not found for player"}), 404

    plants = row[0]
    message = f"Your base has {plants} plants growing."
    return jsonify({"message": message, "plants": plants})

# Placeholder lentokoneen päivitykselle
@app.route("/api/upgrade-plane", methods=["POST"])
def upgrade_plane():
    conn = get_conn()
    if not conn:
        return jsonify({"error": "Session expired"}), 401

    data = request.get_json()
    player = data.get("player")

    if not player:
        return jsonify({"error": "Missing player"}), 400

    # Placeholder: deduct money and upgrade plane (assuming plane stats exist)
    cursor = conn.cursor()
    cursor.execute("""
        SELECT money FROM game WHERE screen_name = %s
    """, (player,))

    row = cursor.fetchone()
    if not row:
        return jsonify({"error": "Player not found"}), 404

    current_money = int(row[0])
    upgrade_cost = 1000  # Example cost

    if current_money < upgrade_cost:
        return jsonify({"error": "Not enough money"}), 400

    cursor.execute("""
        UPDATE game SET money = money - %s WHERE screen_name = %s
    """, (upgrade_cost, player))
    conn.commit()

    return jsonify({"message": "Plane upgraded successfully!", "cost": upgrade_cost})

@app.route("/api/randomEvent", methods=["GET"])
def randomEvent():
    type = request.args.get("type")
    id = request.args.get("id")

    if type == "duringFlight":
        event = duringflight_eventit.randomrandomiser(id)
    elif type == "airport":
        event = airport_eventit.randomrandomiser(id)
    elif type == "homeBase":
        event = Homebase_eventit.randomrandomiser(id)

    """ TÄSSÄ ESIMERKKI EVENTISTÄ
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
    """
    return jsonify({"event": event})
@app.route('/app.js')
def js():
    return send_from_directory('web_ui', 'app.js')

@app.route('/styles.css')
def css():
    return send_from_directory('web_ui', 'styles.css')

if __name__ == "__main__":
    app.run(debug=True)