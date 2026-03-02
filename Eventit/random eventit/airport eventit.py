def tulli():

    print("Customs are asking you to verify cargo")

    while True:
        vastaus = input("Are you willing to show cargo? (yes/no) ")
        if vastaus.upper() == "YES":
            print('Customs: ("checking")')
            print("You're good to go! ")
            break
        elif vastaus.upper() == "NO":
            print("Customs: We're going to get you to prison")
            #pelin lopetus funktio
            break
        else:
            print("Enter yes/no")



