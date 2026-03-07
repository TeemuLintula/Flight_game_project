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
