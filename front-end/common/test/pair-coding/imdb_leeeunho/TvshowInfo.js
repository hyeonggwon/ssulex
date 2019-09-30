import React, { Component } from 'react';

class TvshowInfo extends Component {
  static defaultProps = {
    info: {
      id : "tt12312",
      type: 1,
      title : "fun",
      year: 1996,
      synopsis : "asdf",
      genres : "TV_Show",
      thumb_url : "sd",
      rating : 3
    }
  }
  
  render() {
    const style = {
      border: '1px solid black',
      padding: '8px',
      margin: '8px',
      height : '100px',
      width : '100px',
      float : 'left'
    };

    const {
      id,type,title,year,synopsis,genres,thumb_url,rating
    } = this.props.info;
    
    return (
      <div style={style} id={id}>
        <div>Image</div>
        <div id='title'>{title}</div>
      </div>
    );
  }
}

export default TvshowInfo;
