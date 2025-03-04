# RME React Mavlink Express

# Trying to make hotkeys work with a simplified express app and react frontend with SITL and Mavlink

# Running the Application

There are 3 parts to the application

* SITL
* Back-End
* Front-End

# SITL 
1. install SITL on your system and start arducopter
(I used windows as it was much easier)

Here's the link for installing SITL on Windows and starting ArduCopter:
[SITL Installation & ArduCopter Startup (Windows)](https://youtu.be/dkaakbmZvZ4?si=JvpBkwedYy4q2epf)



2. Run the command on the CYGWIN terminal to download the ardupilot repo

    ```bash
     git clone -b Copter-3.4.6 https://github.com/ardupilot/ardupilot.git
     ```
    
3. navigate to the correct directory with this command

    ```bash
      cd ardupilot/Tools/autotest/
     ```

    
4. Run the command to start the simulation and open up the port for udp mavlink messages (in the case you have 2 separate pcs on the same network, if you run both webserver and SITL simuation on the same PC you will have to change various ports and ips on "server.js" (backend))
  
    ```bash
     ./sim_vehicle.py -v ArduCopter --console --map \ --out=udp:<web-stack-pc-ip>:14550 \ --out=udp:<SITL-pc-ip>:14551^C
     ```

     

# back-End :
1. Navigate to the backend by using / or open in a new terminal
   
   ```bash
   cd ./backend
   ```
   
2. Install all dependencies by running
   
   ```bash
   npm i 
   ```
   
3. Run the server using the command

   ```bash
   node server
   ```
4. The Backend server will be running by default on port 4000

# Front-End :
1. Navigate to the Frontend by using / or open in a new terminal
   
   ```bash
   cd ./frontend
   ```
   
2. Install all dependencies by running
   
   ```bash
   npm i 
   ```
   
3. Run the Frontend server using the command

   ```bash
   npm run dev
   ```

4. The Frontend server will be running by default on port 5173
   open the link on a web browser to view the application

   ```bash
   http://localhost:5173
   ```

# Using the application: 

1. there are key mappings for various drone inputs, for now its aswd -> movement and direction keys -> camera movement
2. hokeys are activated using the toggle button  , may need to send a loiter command when hotkeys go frm  false -> true
   





