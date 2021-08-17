import React, { useState, useEffect } from 'react';
import './App.css';
import { API, Storage } from 'aws-amplify';
import { withAuthenticator, AmplifySignOut } from '@aws-amplify/ui-react';
import { listNotes } from './graphql/queries';
import { createNote as createNoteMutation, deleteNote as deleteNoteMutation } from './graphql/mutations';

const initialFormState = { name: '', description: '' }
var imageArrayName = []

function App() {
  const [notes, setNotes] = useState([]);
  const [formData, setFormData] = useState(initialFormState);
//ceshi ceshi 
  useEffect(() => {
    fetchNotes();
  }, []);

  async function onChange(e) {

    

    for(var i = 0;i<e.target.files.length;i++){
      const file = e.target.files[i];
      imageArrayName.push(file.name)
      console.log(imageArrayName)
    }
    setFormData({ ...formData, image: imageArrayName});

    for(var i = 0;i<e.target.files.length;i++){
      await Storage.put(imageArrayName[i], e.target.files[i]);
    }

    // for(var i = 0;i<e.target.files.length;i++){
    //   await Storage.put(imageArrayName[i], e.target.files[i]);
    //   const image = await Storage.get(formData.image[i]);

    //   console.log("测试存储     " +image)
    // }



    fetchNotes();


  }

  //上传数据啊啊
  async function createNote() {
    if (!formData.name || !formData.description) return;

    
  
    console.log("图       "+formData.image)
    await API.graphql({ query: createNoteMutation, variables: { input: formData } });
    
    if (formData.image) {
      for(var i = 0;i<formData.image.length;i++){
        const image = await Storage.get(formData.image[i]);
        formData.image[i] = image;

        console.log("图jieguo 前3333       "+image)
      }
    }

    console.log("图jieguo zuizhong      "+formData.image)
    
    setNotes([ ...notes, formData ]);
    setFormData(initialFormState);
  }
  



//检索数据库数据
  async function fetchNotes() {
    const apiData = await API.graphql({ query: listNotes });
    const notesFromAPI = apiData.data.listNotes.items;

    await Promise.all(notesFromAPI.map(async note => {
      if (note.image) {
        const image = await Storage.get(note.image[0]);
        note.image = image;
        console.log("sssssss-------       "+image)
      }
//网址图片
console.log("sssssss+++++++       "+note.image[0])



      return note;
    }))
    setNotes(apiData.data.listNotes.items);
  }

  

  async function deleteNote({ id }) {
    const newNotesArray = notes.filter(note => note.id !== id);
    setNotes(newNotesArray);
    await API.graphql({ query: deleteNoteMutation, variables: { input: { id } }});
  }

  return (
    <div className="App">
      <h1>My Notes App</h1>
      <input
        onChange={e => setFormData({ ...formData, 'name': e.target.value})}
        placeholder="Note name"
        value={formData.name}
      />
      <input
        onChange={e => setFormData({ ...formData, 'description': e.target.value})}
        placeholder="Note description"
        value={formData.description}
      />
      <input
        type="file"
        multiple="multiple"
        onChange={onChange}
      />
      <button onClick={createNote}>Create Note</button>
      <div style={{marginBottom: 30}}>
      {
  notes.map(note => (
    <div key={note.id || note.name}>
      <h2>{note.name}</h2>
      <p>{note.description}</p>
      <button onClick={() => deleteNote(note)}>Delete note</button>
      {
        note.image && <img src={note.image} style={{width: 400}} />
      }
      
    </div>
  ))
}
      </div>
      <AmplifySignOut />
    </div>
  );
}

export default withAuthenticator(App);