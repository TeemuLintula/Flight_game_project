from flask import Flask, render_template, send_from_directory, request, jsonify
from Eventit import GameSetup

#tallentaa luodut yhteydet palvelimeen
connections = {}
app = Flask(__name__, template_folder='web_ui')
@app.route('/flight_game_run')
def flight_game_run():
    return render_template("index.html")

#Route Javascriptille kun loginiä painetaan Gamesetup luo yhteyden
@app.route("/api/db-login", methods=["POST"])
def db_login():
    data = request.get_json()
    user = data["user"]
    password = data["password"]

    conn = GameSetup.db_connection(user, password)
    session_id = user
    connections[session_id] = conn
    return jsonify({"session": session_id})
#Route Javascriptille joka lataa GameSetup.py scriptistä kaikki savet
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

@app.route('/app.js')
def js():
    return send_from_directory('web_ui', 'app.js')

@app.route('/styles.css')
def css():
    return send_from_directory('web_ui', 'styles.css')

if __name__ == "__main__":
    app.run(debug=True)