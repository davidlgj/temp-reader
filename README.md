# Temperature reading and control with Raspberry Pi Pico + SHT30 and KalumaJS

My house is heated by burning wood pellets, and when the simple on/off thermostat broke i hacked together an ovengineered solution.
This is the code for the temperature reader, which then sends on/off commands to a relay over wifi, emulating the old simple thermostat!

I'm using kalumajs on the a Raspberry Pi Pico W board, mostly because I can then use typescript and get nice
editor support and my Python is spotty at best.
