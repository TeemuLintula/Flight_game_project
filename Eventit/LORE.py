import sys,time

def sprint(str):
   for c in str + '\n':
     sys.stdout.write(c)
     sys.stdout.flush()
     time.sleep(4./90)
def lore(name):
    sprint(f"{name}, single father from Kittee is in a huge amount of debt to the state.\n"
          "He inherits his father’s old airplane and a private airfield.\n"
          f"{name} leaves his child in the care of his sister.\n"
          "In a hangar at the airfield, a secret leftover business is discovered.\n"
          f"Someone calls just as {name} finds a hidden spice plantation.\n"
          f"From this, {name} receives the first mission.")

def lore_ending(name):
    sprint(f"{name} has finally collected enough money to buy island of the big E.\n"
           "After a long journey, fight after another, mistakes been made.\n"
           f"{name} goes back to Kittee to retrieve the daughter.\n"
           f"Finds out {name}'s sister has kidnapped the daughter.\n"
           f"{name} starts to yell at they're sister:\n"
           "WHERES MY DAUGHTER!\n"
           f"{name} calls the polices and explains them the situation.\n"
           f"Meanwhile interpol has searched for {name} this whole time.\n\n"
           f"Interpol finds the daughter and threatens {name}:\n"
           "Surrender or you will lose your only child to social welfare authorities.\n"
           f"{name} gives up and surrenders...\n\n"
           f"10 years later {name} gets out of prison and recieves a phone call.\n"
           '"Come visit me to this address."\n'
           f"{name} looks up the address, it's coordinates to the island of big E.\n"
           f"{name} picks up the lost airplane which they used for work. After thinking for awhile {name} Flies to island of big E.\n"
           f"When {name} arrives to the island, first thing they see is their daughter.\n"
           f"After all this time, finds out the daughter continued {name}'s work for a decade.\n"
           f"{name} walks up to the daughter and they hug for good 5 minutes.\n"
           "Then daughter says:\n"
           "Father, let's continue where you left off 10 years ago\n\n"
           "The End")
