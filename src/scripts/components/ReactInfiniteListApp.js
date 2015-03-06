'use strict';

var React = require('react/addons');
var ReactTransitionGroup = React.addons.TransitionGroup;

// CSS
require('styles/normalize.css');
require('styles/main.css');

var imageURL = require('../../images/yeoman.png');

var ReactInfiniteListApp = React.createClass({
  render: function() {
    return (
      <div className='main'>
        <ReactTransitionGroup transitionName="fade">
          <img src={imageURL} />
        </ReactTransitionGroup>
      </div>
    );
  }
});
React.render(<ReactInfiniteListApp />, document.getElementById('content')); // jshint ignore:line

module.exports = ReactInfiniteListApp;
