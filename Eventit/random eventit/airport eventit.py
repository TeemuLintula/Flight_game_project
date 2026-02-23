def tulli():

    print("Customs are asking you to verify cargo")
    vastaus = input("Are you willing to show cargo? (yes/no) ")

    if vastaus == "yes":
        print('Customs: ("checking")')
        print("You're good to go! ")
    elif vastaus == "no":
        print("Customs: We're going to get you to prison")
    else:
        print("Enter yes or no")
        return

import random


def terrorist():
    print("Bad men are trying to kidnap the plane!")

    while True:
        vastaus = input("Are you going to (1) be a hero or (2) look away and pray? Enter 1 or 2: ")

        if vastaus == "1":
            luku = random.randint(1, 10)

            if luku <= 5:
                print("Your attempt to fight the bad men failed.")
            else:
                print("You punched the bad men while they weren’t looking.")
                print("You successfully prevented the kidnapping!")
            break

        elif vastaus == "2":
            luku2 = random.randint(1, 4)

            if luku2 == 1:
                print("The bad men flew the plane into a building. You died.")
            else:
                print("The bad men kidnapped you and you rotted in a cell for 1 year.")
            break

        else:
            print("Please enter only 1 or 2.")


# Call the function
