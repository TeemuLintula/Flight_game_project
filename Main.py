from flask import Flask, render_template, send_from_directory, request, jsonify
from Eventit import GameSetup, Mission
import random

#tallentaa luodut yhteydet palvelimeen
connections = {}
app = Flask(__name__, template_folder='web_ui')
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
    session_id = request.headers.get("X-DB-Session")
    conn = connections.get(session_id)
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
    session_id = request.headers.get("X-DB-Session")
    conn = connections.get(session_id)

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
    session_id = request.headers.get("X-DB-Session")
    conn = connections.get(session_id)
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


@app.route('/app.js')
def js():
    return send_from_directory('web_ui', 'app.js')

@app.route('/styles.css')
def css():
    return send_from_directory('web_ui', 'styles.css')

if __name__ == "__main__":
    app.run(debug=True)