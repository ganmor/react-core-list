(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(['react', 'underscore'], factory);
    } else if (typeof exports === 'object') {
        module.exports = factory(require('react'), require('underscore'));
    } else {
        root.InfiniteListComponent = factory(root.React);
    }
}(this, function (React, _) {

  var getWindowHeight,
      nextFrame,
      cancelFrame,
      DEFAULTS,
      InfiniteListComponent,
      InfiniteListItem;

  // Utility

  getWindowHeight = function() { return  window.innerHeight };

  nextFrame = (function () {
     return window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        window.oRequestAnimationFrame ||
        window.msRequestAnimationFrame || function (callback) {
           return window.setTimeout(callback, 1);
        };
  })();

  cancelFrame = (function () {
     return window.cancelRequestAnimationFrame ||
        window.webkitCancelAnimationFrame ||
        window.webkitCancelRequestAnimationFrame ||
        window.mozCancelRequestAnimationFrame ||
        window.oCancelRequestAnimationFrame ||
        window.msCancelRequestAnimationFrame ||
        window.clearTimeout;
  })();


  // Default Config
  DEFAULTS = {};
  DEFAULTS.DEFAULT_ITEM_HEIGHT = 35;
  DEFAULTS.MARGIN_BOTTOM = 0;
  DEFAULTS.MARGIN_OUT_SCREEN = 10 * DEFAULTS.DEFAULT_ITEM_HEIGHT;



   var InfiniteListComponent = React.createClass({

     //
     // Life Cycle
     //

     componentDidMount : function () {

       this._configuration = _.extend(DEFAULTS, this.props.config);
       this.setState({
         initialOffsetTop : this.getDOMNode().offsetTop,
         viewPortHeight : (getWindowHeight() - this.getDOMNode().offsetTop - this._configuration.MARGIN_BOTTOM),
         listHeight : this.getListFullHeight()
       });

       this.keepDisplayInSync();
     },

     getInitialState : function (){
       return {
         startIdx : 0,
         endIdx : 30, /* FIXME */
         offsetTop : 0,
         differential : false
       }
     },

     componentWillReceiveProps : function () {
        this.setState({
          viewPortHeight : (getWindowHeight() - this.getDOMNode().offsetTop - this._configuration.MARGIN_BOTTOM),
          listHeight : this.getListFullHeight()
        });
     },

     componentWillUpdate : function (nextProps, nextState) {

       // Compare states, maybe measure  height ? and compute list virtual height

       var refName, isRendered, wasDisplayed, willBeAdded, offsetCorrection, instance_;

       if (!nextState.differential) { return; }

       instance_ = this;
       offsetCorrection = 0;

       console.log('UPDATE LOOP TRIGGERED');

       _.each(this.props.children, function (ReactCpnt, idx) {

          var ref, wasDisplayed, isDisplayed, hasBeenRemovedBefore, hasBeenAddedBefore, direction, elementAppeared, elementDisappeared;

          refName = "infinite-list-item-" + idx;
          ref = instance_.refs[refName];

          wasDisplayed = idx >= this.state.startIdx && idx <= this.state.endIdx;
          isDisplayed = idx >= nextState.startIdx && idx <= nextState.endIdx;

          elementAppeared = isDisplayed && !wasDisplayed;
          elementDisappeared = !isDisplayed && wasDisplayed;

          direction = nextState.startIdx > this.state.startIdx ? 'down' : 'up';


          // Buffering did not occur correctly
          if (!ref || !ref._cachedHeight){ return; }


          if (direction === 'up' && elementAppeared && idx <= this.state.startIdx) {
             offsetCorrection = offsetCorrection - ref._cachedHeight;
          }


          if (direction === 'down'&& elementDisappeared && idx < nextState.startIdx) {
            offsetCorrection = offsetCorrection + ref._cachedHeight;
          }

       }, this);


       // Get correct offset top
       nextState.offsetTop = nextState.offsetTop + offsetCorrection;

     },

     componentDidUpdate : function (prevProps, prevState) {
        // Must result for next compare
        this.state.listRealHeight = this.refs['list-rendered'].getDOMNode().scrollHeight;
        this.state.offsetBottom = this.state.offsetTop + this.state.listRealHeight;
     },

     render : function () {

       var wrapperStyle, positionningDivStyle, listSizerStyle, startIdx, endIdx, instance_;

       if (!this.state.viewPortHeight) { return (<div></div>) }

       this.oldScroll =  this.getScroll();
       instance_ = this;

       wrapperStyle = {
          height : this.state.viewPortHeight,
          webkitOverflowScrolling : 'touch',
          overflowY:'auto',
          width:'100%',
          position:'relative'
        };

       positionningDivStyle = {
         WebkitTransform : 'translate(0, ' + (this.state.offsetTop||0) + 'px)',
         MozTransform : 'translate(0, ' + (this.state.offsetTop||0) + 'px)'
       };

       listSizerStyle = {
         height : this.state.listHeight
       };

       startIdx = this.state.startIdx;
       endIdx = this.state.endIdx;



       var infiniteChildren = _.map(this.props.children, function (ReactCpnt, idx) {

         var refName, isRendered, isDisplayed;

         if (idx < startIdx-20) { return; }
         if (idx > endIdx+20) { return; }

         refName = "infinite-list-item-" + idx;
         isDisplayed = idx >= startIdx && idx <= endIdx;

         return (
          <InfiniteListItem rendered={isDisplayed} key={idx} ref={refName}>
            {ReactCpnt}
          </InfiniteListItem>
         );
       });

       return (
         <div style={wrapperStyle}>
          <div style={listSizerStyle}>
            <div className="hidden-infinite-list-buffer" refs="hidden-buffer"></div>
            <div style={positionningDivStyle} ref="list-rendered">
              {infiniteChildren}
            </div>
          </div>
        </div>);
     },


    /*
    * Read the scroll position perodically to update display when neededed
    * Synchronise update with browser frames
    */
    keepDisplayInSync : function () {
      var instance_ = this;
      function repos() {
          nextFrame(function () { instance_.rePositionList.call(instance_, instance_.getScroll()); });
       }
      this.displaySyncInterval =  window.setInterval(repos, 1); // Get rid of those 50 ms ?
    },

    tearDownDisplayUpdate : function () {
      window.clearInterval(this.displaySyncInterval);
    },


    getScroll : function () {
      return this.getDOMNode().scrollTop;
    },

    getListFullHeight: function () {
      var fullLength = this.props.children.length;
      return (fullLength * this._configuration.DEFAULT_ITEM_HEIGHT) || 0;
    },

    //
    //  Real impl
    //
    rePositionList: function (newScroll) {

       var isGoingUp = newScroll < this.oldScroll;
       var isGoingDown = newScroll > this.oldScroll;

       var isBeforeTop = (newScroll < this.state.offsetTop);
       var isAfterBottom = ((newScroll + this.state.viewPortHeight) > this.state.offsetBottom);

       var hasReachedTopOfTheList = (this.state.startIdx == 0);
       var hasReachedBottomOfTheList = (this.state.endIdx == (this.props.children.length));

       this.oldScroll = newScroll;

       if (isGoingUp && hasReachedTopOfTheList && this.state.startIdx == 0) {
          return;
       }

       if (isGoingDown && hasReachedBottomOfTheList) {
          return;
       }

       if ((isBeforeTop || isAfterBottom )) {
          this.approximateInsertion(newScroll);
       } else if (isGoingDown) {
          this.repositionListDown(newScroll);
       } else if (isGoingUp) {
          this.repositionListUp(newScroll);
       }

    },

    repositionListUp: function (newScroll) {

       var targetOffsetTop, move, willReachTop, isTooCloseToBottom, instance_;

       instance_ = this;

       // Check if the bottom of the list is not too close
       isTooCloseToBottom = this.state.offsetBottom < newScroll + this.state.viewPortHeight +  ( this._configuration.MARGIN_OUT_SCREEN / 2)

       // Where we want the new offset top to be
       targetOffsetTop = newScroll - this._configuration.MARGIN_OUT_SCREEN * 2;

       // Compute the move
       move =  Math.max( (this.state.offsetTop - targetOffsetTop) / this._configuration.DEFAULT_ITEM_HEIGHT, 0);

       // Beginning of line
       willReachTop = (this.state.startIdx-move) <= 0;

       if ((!isTooCloseToBottom && move > 3) || willReachTop) {

         move = Math.min(move, this.state.startIdx); // Easy one

         var nextIndexes = this.computeNextIndexesAndBuffer('up', move);
         nextFrame(function () {
           // Update rendering on next available frame
           instance_.setState({ startIdx : nextIndexes.nextStartIdx, endIdx : nextIndexes.nextEndIdx, differential : true });
         });

       }

     },


     repositionListDown: function (newScroll) {
          var instance_, targetOffsetBottom, move, maxMove, isTooCloseToTop, willReachedBottom;

          instance_ = this;

          // Check if top of the list is not too close
          isTooCloseToTop = ( newScroll - this.offsetTop ) < (this._configuration.MARGIN_OUT_SCREEN / 2);

          // Where list is supposed to end now
          targetOffsetBottom = newScroll + this.state.viewPortHeight + this._configuration.MARGIN_OUT_SCREEN * 2;

          // Now we can compute the desired move
          move = Math.max( (targetOffsetBottom - this.state.offsetBottom) / this._configuration.DEFAULT_ITEM_HEIGHT , 0);

          // Another move
          willReachedBottom = (this.state.endIdx + move) >= this.props.children.length;


          if ((!isTooCloseToTop && move>3) || willReachedBottom) {

             move = Math.min(move, (this.props.children.length) - this.state.endIdx);

             var nextIndexes = this.computeNextIndexesAndBuffer('down', move);
             nextFrame(function () {
               // Update rendering on next available frame
               instance_.setState({ startIdx : nextIndexes.nextStartIdx, endIdx : nextIndexes.nextEndIdx, differential : true });
             });

          }
     },


     approximateInsertion: function (newScroll) {

        var fullLength, fullSize, startPosition, endPosition;

        fullLength = this.props.children.length;

        startPosition = Math.round((newScroll * fullLength) / this.getListFullHeight());
        endPosition = Math.round(startPosition + 30);

        this.offsetTop = newScroll - this.state.viewPortHeight;
        this.offsetTop <= 0 ? (this.offsetTop = 0) : (this.offsetTop = this.offsetTop);

        this.setState({
          startIdx : startPosition,
          endIdx : endPosition,
          offsetTop : this.offsetTop,
          differential : false
        });

     },

     /*
     *  From a move, compute the new position
     *  Measure the size of the newly added elements and recompute offset top
     *  Next rendering cycle will use that position, cache size in items when they are rendered
     */
     computeNextIndexesAndBuffer : function (direction, move, newScroll) {

       var instance_, startRenderIdx, endRenderIdx, toRender, rendering, representativeHeight, nextStartIdx, nextEndIdx, marginStart;

      instance_ = this;
      representativeHeight = 0;

       if (direction === 'up') {

         // Compute new indexes
         nextStartIdx = this.state.startIdx - move;
         nextEndIdx = this.state.endIdx - move;

         // Compute new element that will be rendered
         startRenderIdx = this.state.endIdx;
         endRenderIdx = this.state.endIdx + move;

       } else if (direction === 'down') {

         nextStartIdx = this.state.startIdx + move;
         nextEndIdx = this.state.endIdx + move;

         startRenderIdx = this.state.startIdx - move;
         endRenderIdx = this.state.startIdx;
       }

       nextStartIdx = Math.round(nextStartIdx);
       nextEndIdx = Math.round(nextEndIdx);

       toRender = this.props.children.slice(startRenderIdx, endRenderIdx);

       // Force new children to render once ( offscreen) so they can cache their size
       _.each( toRender, function (element, idx) {
         if (instance_.refs['infinite-list-item-' + (startRenderIdx + idx)]
             && !instance_.refs['infinite-list-item-' + (startRenderIdx + idx)]._cachedHeight) {
          instance_.refs['infinite-list-item-' + (startRenderIdx + idx)].setState({ rendered : true, buffer : true });
         }
       }, this);

       return { nextStartIdx : nextStartIdx, nextEndIdx : nextEndIdx };
     }


 });



  /*
  * Wrapper for children components
  * Used to cache the size of elements
  */
  var InfiniteListItem = React.createClass({


    // Cache the height of the element
    componentDidMount : function () {
      if (this.getDOMNode()) {
        this._cachedHeight = this.getDOMNode().offsetHeight;
      }
    },

    componentDidUpdate : function () {
      if (this.getDOMNode()) {
        this._cachedHeight = this.getDOMNode().offsetHeight;
      }
    },

    shouldComponentUpdate : function (nextProps, nextState) {

      var shouldComponentUpdate;
      if (!this.props) {
        return true;
      }

      shouldComponentUpdate = this.props.rendered != nextProps.rendered;

      return shouldComponentUpdate;
    },

    render : function () {

      var style;

      if (!this.props.rendered) {
        return false;
      }

      style = {};
      style.overflow = 'hidden'

      if (this.props.buffer) {
        style.position = absolute;
        style.top = '-1000px;';
      }

      return (<div style={style}>{this.props.children}</div>);
    }
  });

  return InfiniteListComponent;

}));
