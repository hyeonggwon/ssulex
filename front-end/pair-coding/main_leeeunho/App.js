import React, { Component } from 'react';
import TvshowInfoList from './TvshowInfoList';
import './App.css';

class App extends Component {
  state = {
    information: [
      {
        id : "tt12312",
        type: "TV show",
        title : "SNL",
        year: 1996,
        synopsis : "asdf",
        genres : "TV_Show",
        thumb_url : "",
        rating : 3,
      },
      {
        id : "second",
        type: "Drama",
        title : "Star wars",
        year: 2012,
        synopsis : "asdf",
        genres : "TV_Show",
        thumb_url : "",
        rating : 3,
      }
    ]
  }
  
  handleCreat = (data) => {
    const { information } = this.state;
    this.setState({
      information: information.concat({ ...data })
    })
  }

  handleClick = () =>{
    this.input.focus();
  }

  hideMenu = () =>{
    this.sub.style.display = 'none';
  }
  showMenu = () =>{
    this.sub.style.display='block';
  }
  selectMenu = () =>{
    if(this.genre.style.display == 'none')
      this.genre.style.display='block';
    else
      this.genre.style.display='none';
  }

  contronllMenu = () =>{
    if(this.sub.style.display == 'none')
      this.sub.style.display='block';
    else
      this.sub.style.display='none';
    
  }
  render() {
    return (
      <div>
        <div className='Header'>
          <div id='logo'>
            <img src='./image/logo.png'></img>
          </div>
          <div className='inputForm'>
            <textarea id='searchBar' placeholder='input' ref={ref =>this.input=ref}/>
            <input type='button' onClick={this.handleClick} value='click'/>
          </div> 
          <div class="clear"> </div>
        </div>
        <div className="optionList">
            <table class='mainMenu'>
              <thead>
                <th onClick={this.contronllMenu}>Filter</th>
              </thead>
              <tbody id='sub1' ref={ref2 => this.sub=ref2}>
                <tr>
                  <td onClick={this.selectMenu}>genres</td>
                </tr>
                <tr>
                  <td>type</td>
                </tr>
                <tr>
                  <td>year</td>
                </tr>
                <tr>
                  <td>size</td>
                </tr>
              </tbody>
            </table>
            <div>
              <table class='filterInfo'>
                <tbody ref={genre =>this.genre=genre}>
                  <tr>
                    <td>horror</td>
                    <td>comics</td>
                    <td>comics</td>
                    <td>comics</td>
                  </tr>
                </tbody>
              </table>
            </div> 
            <div class="clear"> </div>
          </div>
        <div class='Body'>
          <div className='seriesList'>
            <TvshowInfoList data={this.state.information}/>
          </div>
        </div>
        
      </div>
           
    );
  }
}

export default App;
