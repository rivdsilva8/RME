# RME React Mavlink Express

# Trying to make hotkeys work with a simplified express backend and react frontend with SITL and Mavlink

## Clone the repo with 


 ```bash
     git clone https://github.com/rivdsilva8/RME.git
 ```

# Running the Application

There are 3 parts to the application

* SITL
* Backend
* Frontend

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
     ./sim_vehicle.py -v ArduCopter --console --map \ --out=udp:127.0.0.1:14550 
     ```

     

# backend :

1. Navigate to the backend
   
   ```bash
   cd ./backend-flask
   ```
   
2. Install all dependencies by running
   
   ```bash
   pip install flask flask-socketio pymavlink eventlet OR pip3 install flask flask-socketio pymavlink eventlet

   ```
   
3. Run the server using the command

   ```bash
   python server2.py OR  python3 server2.py
   ```
4. The Backend server (socket) will be running by default on port 5001



# frontend :
1. Navigate to the frontend by using / or open in a new terminal
   
   ```bash
   cd ./frontend
   ```
   
2. Install all dependencies by running
   
   ```bash
   npm i 
   ```
   
3. Run the frontend server using the command

   ```bash
   npm run dev
   ```

4. The frontend server will be running by default on port 5173.  
   Open the link in a web browser to view the application:  

   [http://localhost:5173](http://localhost:5173)

# Using the application: 

1. Before using this Make sure your backend and SITL instance are both up
2. make sure your drone is up, (type into mavproxy terminal)
    ```bash
   mode guided
   arm throttle
   takeoff 20 
   ```
3. Check for Drone telemetry on the Frontend 
4. there are key mappings for various drone inputs, for now its aswd for top-down movement, shift and space for altitude control
5. hokeys are activated using the toggle button  make sure this is on (yellow)
   





