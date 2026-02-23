import random

def karhuryhma():
    print("Your homebase is being investigated by karhuryhmä ")
    drugs = random.randint(1,1000)
    print(f'Your homebase has {drugs} kilograms of drugs')
    if drugs > 250:
        print("High chance of being held into custody")
    elif drugs < 250:
        print("Low chance of being held into custody")
    return

