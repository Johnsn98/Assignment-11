import React from 'react';
import axios from 'axios';
import {BrowserRouter as Router, Switch, Route, Link } from 'react-router-dom';
import './App.css';
import Register from './components/Register/Register';
import Login from './components/Login/Login';
import Profile from './components/Profile/Profile';

import PostList from './components/PostList/PostList';
import Post from './components/Post/Post';
import CreatePost from './components/Post/CreatePost';
import EditPost from './components/Post/EditPost';


class App extends React.Component {
    state = {
      data: null,
      token: null,
      user: null,
      profiles: [],
      post: null,
      posts: []
    }

componentDidMount() {
  axios.get('http://localhost:5000')
  .then((response) => {
    this.setState ({
      data: response.data
    })
  })
  .catch((error) => {
    console.error(`Error fetching data: ${error}`);
  })

  this.authenticateUser();
  this.getAllUsers();
}

authenticateUser = () => {
  const token = localStorage.getItem('token');
  if(!token) {
    localStorage.removeItem('user')
    this.setState({ user: null })
  }
  if(token){
    const config = {
      headers: {
        'x-auth-token': token
      }
    }
    axios.get('/api/auth', config)
    .then((response) => {
      localStorage.setItem('user', response.data.name)
      localStorage.setItem('email', response.data.email)
      this.setState({ 
        user: response.data.name,
        token: token
      },
      () => {
        this.loadData();
      }
      );
    })
    .catch((error)=> {
      localStorage.removeItem('user');
      this.setState({ user: null });
      console.error(`Error logging in: ${error}`);
    })
  }
}

loadData = () => {
  const {token} = this.state;

  if (token) {
    const config = {
      headers: {
        'x-auth-token': token
      }
    };
    axios 
      .get('/api/posts', config)
      .then(response => {
        this.setState({
          posts: response.data
        });
      })
      .catch(error => {
        console.error(`Error fetching data: ${error}`);
      });
  }
}

viewPost = post => {
  console.log(`view ${post.title}`);
  this.setState({
    post: post
  });
};

editPost = post => {
  this.setState({
    post: post
  });
};

onPostCreated = post => {
  const newPosts = [...this.state.posts, post];

  this.setState({
    posts: newPosts
  });
};

onPostUpdated = post => {
  console.log('updated post: ', post);
  const newPosts = [...this.state.posts];
  const index = newPosts.findIndex(p => p._id === post._id);

  newPosts[index] = post;

  this.setState({
    posts: newPosts
  });
};

//delete post
deletePost = post => {
  const {token} = this.state;

  if (token){
    const config ={
      headers: {
        'x-auth-token':token
      }
    };
    axios
      .delete(`/api/posts/${post._id}`, config)
        .then(response => {
          const newPosts = this.state.posts.filter(p => p._id !== post._id);
            this.setState({
              posts: [...newPosts]
            });
        })
        .catch(error => {
          console.error(`Error deleting post: ${error}`);
        });
  }
};

getAllUsers = () => {
  const token = localStorage.getItem("token");
  if (!token) {
    localStorage.removeItem("user");
    this.setState({ user: null });
  }

  if (token) {
    const auth = {
      headers: {
        "x-auth-token": token
      }
    };
    axios
      .get("/api/users", auth)
      .then(response => {
        let allUsers = response.data;
        this.setState({ profiles: response.data });
        console.log(this.state.profiles);
        console.log(this.state.profiles.map(name => ({ name: name })));
        return allUsers[0].name;
      })
      .catch(error => {
        console.error(`Error logging in: ${error}`);
      });
  }
};

logOut = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('user');
  localStorage.removeItem('email');
  this.setState({ user: null, token: null });
}
  
render() {
  let { user, post, posts, token } = this.state;
  const authProps = {
    authenticateUser: this.authenticateUser
  };

  return (
    <Router>
    <div className="App">
      <header className="App-header">
         <h4>Assignment10</h4>
         <ul>
           <li>
            <Link to="/">Home</Link>
          </li>
          <li>
          {user ? (
            <Link to="/new-post">New Post</Link>
          ) : (
            <Link to="/register">Register</Link>
          )}
          </li>
                 
          <li>
          {user ? (
            <Link to="" onClick={this.logOut}>Log out</Link>):(
            <Link to="/Login"> Log in</Link>)}
          </li>
          <li>
            <Link to="/profile">Profile</Link>
          </li>

         </ul>
      </header>
      <main>
        <Route exact path="/">
          {user ? (
          <React.Fragment>
            <div>Hello {user}!</div>

            <PostList 
                posts={posts} 
                clickPost={this.viewPost}
                deletePost={this.deletePost}
                editPost={this.editPost}
                />         
            </React.Fragment> 

            ):( 

            <React.Fragment>
              Please Register or Login
            </React.Fragment>  
              )}
              
        </Route>

        <Switch>
       
        <Route 
        path="/posts/:postId">
          <Post post={post} />
        </Route>
       
        <Route 
        path="/new-post">
          <CreatePost token={token} onPostCreated={this.onPostCreated}/>
        </Route>

        <Route path="/edit-post/:postId">
              <EditPost
                token={token}
                post={post}
                onPostUpdated={this.onPostUpdated}
              />
        </Route>

       <Route 
        exact path="/register"
        render={() => <Register {...authProps} />} />


        <Route 
        exact path="/login" 
        render={() => <Login {...authProps} />} />

        <Route 
        exact path="/profile" 
        render={() => <Profile {...authProps} />  }> 
        </Route>

        <Route 
        exact path="/profile" 
        render={() => <Profile {...authProps} />  }> 
        </Route> 

        </Switch>
        </main>
    </div>
    </Router>
  );
}
}

export default App;
