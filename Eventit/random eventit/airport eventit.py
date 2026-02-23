import random


def terrorist():
    print("Bad men are trying to kidnap the plane!")

    while True:
        vastaus = input("Are you going to (1) be a hero or (2) look away and pray? Enter 1 or 2: ")
        # be a hero 50/50 kuoleman mahis
        if vastaus == "1":
            luku = random.randint(1, 10)

            if luku <= 5:
                print("Your attempt to fight the bad men failed.")
                luku2 = random.randint(1, 4)

                if luku2 == 1:
                    print("The bad men flew the plane into a building. You died.")
                    #tähän pelin lopetus funktio!
                else:
                    print("The bad men kidnapped you and you rotted in a cell for 1 year.")
                break
            else:
                print("You punched the bad men while they weren’t looking.")
                print("You successfully prevented the kidnapping!")
            break
        # lookaway and pray 20/80 kuoleman mahdillisuus 
        elif vastaus == "2":
            luku2 = random.randint(1, 4)

            if luku2 == 1:
                print("The bad men flew the plane into a building. You died.")
                #tähän pelin lopetus funktio!
            else:
                print("The bad men kidnapped you and you rotted in a cell for 1 year.")
            break

        else:
            print("Please enter only 1 or 2.")


# Call the function
terrorist()