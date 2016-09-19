# `cdi-mysql-express`

Requirements
-----
1. MongoDB 3.2
2. Redis
3. Node.js version 5.0 to 6.4.0

## Running the application
1. Download zip

2. Make sure redis server is running in correct PORT and HOST
 ```sh
  $ redis-server
  ```

3. Run this commands to get started:
  ```sh
  $ sudo npm i -g forever
  $ sudo npm i -g nodemon
  $ sudo npm install
  ```

4. To run the server using nodemon: 
  ```sh
  $ nodemon server.js
  ```

5. Using cluster:
  ```sh
  $ nodemon cluster.js
  $ forever start cluster.js
  ```

6. After starting the server, run this commands to check:
  ```sh
  $ curl http://localhost:8000
  ```
  
7. To get apidocs
  ```sh
  $ npm run docs
  ```
  Then check localhost:8000/apidoc/
  
 ## Directory-tree 
```
.
├── assets
├── config
    └── env
├── controllers
├── database
├── helpers
├── lib
├── logs
├── test
    └── controllers
├── uploads
└── views
```

# Folders
- assets -- where you place img, css, bower_components, fonts
- helpers -- js files for reusable methods
- uploads -- where users can upload files, and images
- views -- where templates are placed
- others are self explanatory I guess

# Create Controller
 Controllers are the heart of your application, as they determine how HTTP requests should be handled. They are located at the `controllers` folder. They are not automatically routed. You must explicitly route them in `config/router.js`. Using sub-folders for file organization is allowed.

License
-----
MIT


<!-- ## Special Thanks
(https://www.bithound.io/github/anyTV/anytv-node-boilerplate), especially rvnjl <3 -->
