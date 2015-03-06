'use strict';

var React = require('react/addons');
var ReactTransitionGroup = React.addons.TransitionGroup;

// CSS
require('../../styles/normalize.css');
require('../../styles/main.css');

var infiniteList = require('../react-infinite-list');

var ReactInfiniteListApp = React.createClass({
  render: function() {
    return (
      <div className='main'>
          TEst
      </div>
    );
  }
});
React.render(<ReactInfiniteListApp />, document.getElementById('content')); // jshint ignore:line

module.exports = ReactInfiniteListApp;
