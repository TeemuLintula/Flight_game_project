import sys,time

def sprint(str):
   for c in str + '\n':
     sys.stdout.write(c)
     sys.stdout.flush()
     time.sleep(4./90)
def lore():
    sprint("Petteri, single father from Kittee is in a huge amount of debt to the state.\n"
          "He inherits his father’s old airplane and a private airfield.\n"
          "Petteri leaves his child in the care of his sister.\n"
          "In a hangar at the airfield, a secret leftover business is discovered.\n"
          "Someone calls just as Petteri finds a hidden spice plantation.\n"
          "From this, Petteri receives the first mission.")
