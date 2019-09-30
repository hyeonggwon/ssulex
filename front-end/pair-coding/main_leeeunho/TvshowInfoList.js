import React, { Component } from 'react';
import TvshowInfo from './TvshowInfo';

class TvshowInfoList extends Component {
  static defaultProps = {
    data : []
  }
  
  render() {
    const {data} = this.props;
    const list = data.map(
      info => (<TvshowInfo key={info.id} info={info}/>)
    );

    return (
      <div>
        {list}    
      </div>
    );
  }
}

export default TvshowInfoList;
