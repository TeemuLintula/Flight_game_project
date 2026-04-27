import random

class tapahtuma:
    instances = []
    def __init__(self, id, text="", buttons=None):
        self.id = id
        self.text = text
        self.buttons = buttons
        tapahtuma.instances.append(self)

# ------------------- SKINWALKER EVENT -------------------

skinwalker = tapahtuma(2)
skinwalker.text = (
    "Someone starts to knock your door.\n"
    "You check through the peephole and see a pale tall man.\n"
    "He says: 'Can you open the door, I’m starving.'\n"
    "What will you do?"
)
skinwalker.buttons = [
    {"label": "Let him in", "id": 3},
    {"label": "Question him", "id": 4},
    {"label": "Stay silent", "id": 5}
]

skinwalker_let_in = tapahtuma(3)
skinwalker_let_in.text = "He thanks you... then attacks you instantly."
skinwalker_let_in.buttons = [{"label": "Continue", "id": 1}]

skinwalker_question = tapahtuma(4)
skinwalker_question.text = "You question him. His answers seem suspicious. What now?"
skinwalker_question.buttons = [
    {"label": "Don't let him in", "id": 6},
    {"label": "Let him in anyway", "id": 3}
]

skinwalker_safe = tapahtuma(6)
skinwalker_safe.text = "He stares through the peephole... then leaves. You survive."
skinwalker_safe.buttons = [{"label": "Continue", "id": 1}]

skinwalker_silent = tapahtuma(5)
skinwalker_silent.text = "He waits... then leaves. You go back to sleep."
skinwalker_silent.buttons = [{"label": "Continue", "id": 1}]

# ------------------- NAAPURI EVENT -------------------

naapuri = tapahtuma(7)
naapuri.text = "Your neighbour Greg is knocking on your door. Will you open?"
naapuri.buttons = [
    {"label": "Yes", "id": 8},
    {"label": "No", "id": 9}
]

naapuri_yes = tapahtuma(8)
naapuri_yes.text = "Greg complains about weird smells. Will you stop?"
naapuri_yes.buttons = [
    {"label": "Yes", "id": 10},
    {"label": "No", "id": 11}
]

naapuri_good = tapahtuma(10)
naapuri_good.text = "Greg thanks you. (+1000 social credit)"
naapuri_good.buttons = [{"label": "Continue", "id": 1}]

naapuri_bad = tapahtuma(11)
naapuri_bad.text = "Greg gets angry and leaves..."
naapuri_bad.buttons = [{"label": "Continue", "id": 1}]

naapuri_no = tapahtuma(9)
naapuri_no.text = "Greg knocks a few times and leaves."
naapuri_no.buttons = [{"label": "Continue", "id": 1}]

# ------------------- JEHOVAT EVENT -------------------

jehovat = tapahtuma(12)
jehovat.text = "You see Jehovah’s Witnesses at your door."
jehovat.buttons = [
    {"label": "Open the door", "id": 13},
    {"label": "Ignore them", "id": 14}
]

jehovat_open = tapahtuma(13)
jehovat_open.text = "They ask if you want to talk about religion."
jehovat_open.buttons = [
    {"label": "No", "id": 15},
    {"label": "Yes", "id": 16}
]

jehovat_no = tapahtuma(15)
jehovat_no.text = "They continue preaching anyway. Do you join them?"
jehovat_no.buttons = [
    {"label": "No", "id": 17},
    {"label": "Yes", "id": 18}
]

jehovat_yes = tapahtuma(16)
jehovat_yes.text = "You listen carefully. Do you join them?"
jehovat_yes.buttons = [
    {"label": "No", "id": 17},
    {"label": "Yes", "id": 18}
]

jehovat_decline = tapahtuma(17)
jehovat_decline.text = "You decide not to join."
jehovat_decline.buttons = [{"label": "Continue", "id": 1}]

jehovat_join = tapahtuma(18)
jehovat_join.text = "You join them and receive a magazine."
jehovat_join.buttons = [{"label": "Continue", "id": 1}]

jehovat_ignore = tapahtuma(14)
jehovat_ignore.text = "You don't open the door. They leave."
jehovat_ignore.buttons = [{"label": "Continue", "id": 1}]

# ------------------- RANDOM EVENT SYSTEM -------------------

def randomrandomiser(id):
    tapahtumat = [2, 7, 12]
    event = {}
    newid = int(id)

    if newid == 0:
        newid = random.choice(tapahtumat)

    for i in tapahtuma.instances:
        if i.id == newid:
            event = {
                "text": i.text,
                "buttons": i.buttons
            }

    print(event)
    return event