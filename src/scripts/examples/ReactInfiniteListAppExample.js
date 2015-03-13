'use strict';

var React = require('react/addons');
var ReactTransitionGroup = React.addons.TransitionGroup;

// CSS
require('../../styles/normalize.css');
require('../../styles/main.css');

var ReactInfiniteList = require('../react-infinite-list');
var _ = require('underscore');


var UpdateButton = React.createClass({
  render : function () {
    return (
      <button onClick={this.props.shuffleColors}> Shuffle colors</button>
    );
  }

});

var Person =  React.createClass({

  render : function () {

    var height = 75 + Math.random()* 40;
    this.color = this.props.element.id%2==0 ? this.props.colors[0] : this.props.element.id%3==0 ?  this.props.colors[1] :  this.props.colors[2] ;

    return (<div className="item-line-style" style={{background:this.color, borderBottom:'1px solid silver'}}>
              <div>
                <img src={this.props.element.picture} height="55"  style={{verticalAlign:'middle'}} />
                <span style={{paddingLeft:'25px'}}><strong>{this.props.element.name} </strong> - {this.props.element.company}</span>
                <div>{this.props.element.about}</div>
              </div>
            </div>);
  }
  });


function getRandomColor() {
  var letters = '0123456789ABCDEF'.split('');
  var color = '#';
  for (var i = 0; i < 6; i++ ) {
      color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

var PeopleList = React.createClass({
  getInitialState : function () {
    return { colors : ['#2a3fe5', '#949DEA', 'white']};
  },
  shuffleColors : function () {
    this.setState({
      colors : [getRandomColor(), getRandomColor(), getRandomColor()]
    });
  },
  render : function () {

    var elements = _.map(this.props.jsonList, function (element) {
      return (<Person element={element} key={element.id} colors={this.state.colors} />);
    }, this);

    return (
      <div>
        <ReactInfiniteList>
          {elements}
        </ReactInfiniteList>
      </div>
    );
  }

});

var jsonData = require('./data/people-dataset');
var mountNode = document.querySelector('#placeholder');
React.render(<PeopleList jsonList={jsonData} />, document.getElementById('content')); // jshint ignore:line

module.exports = PeopleList;
