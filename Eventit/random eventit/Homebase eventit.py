import random

def karhuryhma():
    print("Your homebase is being investigated by karhuryhmä ")
    spice = random.randint(1,1000)
    print(f'Your homebase has {spice} kilograms of spices')
    if spice > 250:
        print("High chance of being held into custody")
    elif spice < 250:
        print("Low chance of being held into custody")
    return

karhuryhma()