import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchPosts, createPost, updatePost, deletePost } from "../frontend/src/redux/memdataSlice";

const PostManager = () => {
  const dispatch = useDispatch();
  const posts = useSelector((state) => state.posts.items);
  const status = useSelector((state) => state.posts.status);
  const error = useSelector((state) => state.posts.error);

  const [url, setUrl] = useState("http://localhost:3005/api/member");
  const [newPost, setNewPost] = useState({ name: "", desgn: "" });
  const [editPost, setEditPost] = useState({ id: null, name: "", desgn: "" });

  useEffect(() => {
    if (url && status === "idle") {
      dispatch(fetchPosts(url));
    }
  }, [url, status, dispatch]);

  const handleFetch = () => {
    dispatch(fetchPosts(url));
  };

  const handleCreate = () => {
    dispatch(createPost({ url, data: newPost }));
    setNewPost({ name: "", desgn: "" });
  };

  const handleUpdate = () => {
    dispatch(updatePost({ url, id: editPost.id, data: editPost }));
    setEditPost({ id: null, name: "", desgn: "" });
  };

  const handleDelete = (id) => {
    dispatch(deletePost({ url, id }));
  };

  if (status === "loading") return <div>Loading...</div>;
  if (status === "failed") return <div>Error: {error}</div>;

  return (
    <div>
      <input
        type="text"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="Enter API URL"
      />
      <button onClick={handleFetch}>Fetch Posts</button>

      <div>
        <h2>Create New Post</h2>
        <input
          type="text"
          value={newPost.name}
          onChange={(e) => setNewPost({ ...newPost, name: e.target.value })}
          placeholder="name"
        />
        <input
          type="text"
          value={newPost.desgn}
          onChange={(e) => setNewPost({ ...newPost, desgn: e.target.value })}
          placeholder="desgn"
        />
        <button onClick={handleCreate}>Create Post</button>
      </div>

      <div>
        <h2>Edit Post</h2>
        <input
          type="text"
          value={editPost.name}
          onChange={(e) => setEditPost({ ...editPost, name: e.target.value })}
          placeholder="name"
        />
        <input
          type="text"
          value={editPost.desgn}
          onChange={(e) => setEditPost({ ...editPost, desgn: e.target.value })}
          placeholder="desgn"
        />
        <button onClick={handleUpdate}>Update Post</button>
      </div>

      <h2>Posts</h2>
      {posts.map((post) => (
        <div key={post.id}>
          <h3>{post.name}</h3>
          <p>{post.desgn}</p>
          <button onClick={() => setEditPost(post)}>Edit</button>
          <button onClick={() => handleDelete(post.id)}>Delete</button>
        </div>
      ))}
    </div>
  );
};

export default PostManager;
