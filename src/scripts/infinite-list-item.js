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

    // Cache the height of the element
    componentDidMount : function () {
      if (this.getDOMNode()) {
        this.state.cachedHeight = this.getDOMNode().offsetHeight;
      }
    },

    componentDidUpdate : function () {
      if (this.getDOMNode()) {
        this.state.cachedHeight = this.getDOMNode().offsetHeight;
      }
    },

    shouldComponentUpdate : function (nextProps, nextState) {

      var renderStatusChanged, shouldComponentUpdate;
      if (!this.props) {
        return true;
      }

      shouldComponentUpdate = (this.props.rendered != nextProps.rendered) || nextProps.rendered;

      return shouldComponentUpdate;
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
