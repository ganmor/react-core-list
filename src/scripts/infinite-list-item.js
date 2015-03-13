var React = require('react'),
  _ = require('underscore');


 /*
  * Wrapper for children components
  * Used to cache the size of elements
  */
  var InfiniteListItem = React.createClass({


    getInitialState : function () {
      return {};
    },
    render : function () {

      var style;

      if (!this.props.rendered) { return false; }

      style = {};
      style.overflow = 'hidden'

      return (<div style={style}>{this.props.children}</div>);
    }
  });


  module.exports = InfiniteListItem;
