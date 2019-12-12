import express from 'express';
import connectDatabase from './config/db';
import {check, validationResult} from 'express-validator';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import config from 'config';
import User from './models/User';
import Post from './models/post';
import auth from './middleware/auth';
import path from 'path';


// initialize express application
const app = express();

//connectDatabase()
connectDatabase();

// configure Middleware
app.use(express.json({ extened: false}));
app.use(
    cors({
        origin: 'http://localhost:3000'
    })
);

app.post(
    '/api/users', 
    [ 
        check('name', 'Please enter your name')
        .not()
        .isEmpty(),

        check('email', 'Please enter your email')
        .isEmail(),
        check(
            'password', 
            'Please enter a password with 6 or more characters'
            ).isLength({ min: 4 })
    ],
    
    async (req, res) => {
        const errors = validationResult(req);
        if(!errors.isEmpty()) {
            return res.status(422).json({ errors: errors.array() });
        } 
        
        else {
            const { name, email, password } = req.body;
            try {
                //see if user exists
                let user = await User.findOne ({email: email});
                if (user) {
                    return res
                    .status(400)
                    .json({ errors: [{ msg: 'User already exists' }] });
             
               }
                //create new user
                  user = new User({
                      name: name,
                      email: email,
                      password: password
                  });
                  
                  // Encrypt the password
                const salt = await bcrypt.genSalt(10);
                user.password = await bcrypt.hash(password, salt);

                  // save the db and return
                await user.save();

                // Generate and return a JWT token
             returnToken(user, res);
            } catch (error) {
                res.status(500).send('Server xxx error');
            }
            }
        }
 );

/**
 * @route Post api/posts
 * @desc Create post
 */

app.post(
    '/api/posts', 
    [ 
        auth,
        [
        check('title', 'Please enter your title')
        .not()
        .isEmpty(),

        check('body', 'Body text is required')
        .not()
        .isEmpty(),
        ]
    ],
    
    async (req, res) => {
        const errors = validationResult(req);
        if(!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        } 
        
        else {
            const { title, body } = req.body;
            try {
                //Get the user that created the post
                const user = await User.findById(req.user.id);

                // Create a new post
                const post = new Post({
                    user: user.id,
                    title: title,
                    body: body
                });
                
                // Save to the db and return
                await post.save();

                res.json(post);
            } catch (error) {
                console.error(error);
                res.status(500).send('Server error');
            }              
            }
        }
 );

 /**
  * @route Get api/posts
  * @desc Get posts
  */
  
  app.get('/api/posts', auth, async (req,res) => {
      try{
          const posts = await Post.find().sort({ date: -1 });
          res.json(posts);
      } catch (error) {
          console.error(error);
          res.status(500).send('Server error')
      }
  } );

   /**
  * @route Get api/posts/:id
  * @desc Get post (singluar)
  */
  
 app.get('/api/posts/:id', auth, async (req,res) => {
    try{
        const post = await Post.findById(req.params.id);

        // make sure the post was found
        if (!post) {
            return res.status(404).json({ msg: 'Post not found'});
        }
        res.json(post);
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error')
    }
} );

   /**
  * @route Delete api/posts/:id
  * @desc DELETE POST
  */
  
 app.delete('/api/posts/:id', auth, async (req,res) => {
    try{
        const post = await Post.findById(req.params.id);

        // make sure the post was found
        if (!post) {
            return res.status(404).json({ msg: 'Post not found'});
        }

        // Make sure the request user created the post
        if (post.user.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'You are not authorized to delete this post'});
        }
         await post.remove();

        res.json({ msg: 'post removed' });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error uh oh')
    }
} );

   /**
  * @route PUT api/posts/:id
  * @desc Update POST
  */
  
 app.put('/api/posts/:id', auth, async (req,res) => {
    try{
        const { title, body } = req.body;
        const post = await Post.findById(req.params.id);
        //make sure the post was found
        if(!post) {
            return res.status(404).json({ msg: 'Post not found'});
        }
        // maek sure the request user created the post
        if (post.user.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'You are not authorized to edit this post'});
        }
        // Update the post and return
        post.title = title || post.title;
        post.body = body || post.body;
        
        await post.save();

        res.json(post);
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error uh oh')
    }
} );



/**
 * @route Get api/auth
 * @desc Authenticate user
 */

 app.get('/api/auth', auth, async (req, res) => {
     try {
         const user = await User.findById(req.user.id);
         res.status(200).json(user);
     } catch (error) {
         res.status(500).send('Unknown Server ERROR CODE BLUE !!!');
     }
 });

/**
 * @route Post api/login
 * @desc Login user
 */

 app.post(
     '/api/login',
     [
         check('email', 'Please enter a valid email').isEmail(),
         check('password', 'A password is required').exists(),
     ],

async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()){
        return res.status(422).json({ errors: errors.array()});
    } else {
        const { email, password } = req.body;
    try {
        let user = await User.findOne({ email: email });
    if (!user) {
        return res
        .status(400)
        .json({ errors: [{ msg: 'invalid email '}]});
    }

    // check password

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
        return res 
        .status(400)
        .json ({ errors: [{ msg: 'Invalid email or password'}]});
    }

    // Generate and return a jwt Token
    returnToken(user, res);
    } catch (error) {
        res.status(500).send('Server error');
    }
    }
    }
 );

 const returnToken = (user, res) => {
     const payload = {
         user: {
             id: user.id
         }
     };
     jwt.sign(
         payload,
         config.get('jwtSecret'),
         { expiresIn: '10hr' },
         (err, token) => {
             if (err) throw err;
             res.json({token: token})
         }
     );
 }

/**
 * @route GET api/user
 * @desc view users
 */

app.get("/api/users", auth, async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }
    try {
      const users = await User.find();
      res.send(users);
    } catch (error) {
      res.status(500).send("Unknown Server Error - Cannot find users!!");
    }
  });
  

  // serve build files in production 
  if (process.env.NODE_ENV ==='production') {

    // set build folder
    app.use(express.static('client/build'));

    // Route all requests to serve up the build index file 
    // current working directory client/build/index.html
    app.get('*', (req, res) => {
        res.sendFile(path.resolve(__dirname, 'client', 'build', 'index.html'
        ));
    });
  }


//Connection listener

const port = process.env.PORT || 5000;

app.listen(port, () => 
console.log('Express server is running on port ' + port))

