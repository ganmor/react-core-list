var getWindowHeight,
  nextFrame,
  cancelFrame,
  DEFAULTS,
  InfiniteListComponent,
  InfiniteListItem = require('./infinite-list-item.js'),
  React = require('react'),
  _ = require('underscore');


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
  DEFAULTS.DEFAULT_ITEM_HEIGHT = 95;
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

       componentWillUnmount : function () {
        this.tearDownDisplayUpdate();
       },

       getInitialState : function (){
         return {
           startIdx : 0,
           endIdx : 30, /* FIXME */
           bufferStartIdx : 0,
           bufferEndIdx : 40,
           bufferLength : 10,
           offsetTop : 0,
           differential : false,
           realSizes : {}
         }
       },

       componentWillReceiveProps : function () {
          this.setState({
            viewPortHeight : (getWindowHeight() - this.getDOMNode().offsetTop - this._configuration.MARGIN_BOTTOM),
            listHeight : this.getListFullHeight()
          });
       },

       componentWillUpdate : function (nextProps, nextState) {

         var bufferheight, removeElementsHeight, offsetCorrection;

         removeElementsHeight = 0;

         // Not in diff mode, nothing to do
         if (!nextState.differential) { return; }

          // #1: Get buffer size
          bufferheight = this.refs['buffered-elements'].getDOMNode().offsetHeight;

         // #2: Get the remove elements height
         if (nextState.direction === 'up') {

           var removeElements = this.props.children.slice(nextState.endIdx, this.state.endIdx);
           _.each(removeElements, function (el, idx) {
              var refName = "infinite-list-item" + idx;
              var el = this.refs[refName];
              removeElementsHeight = removeElementsHeight + el.getDOMNode().offsetHeight;
           }, this);

           nextState.offsetTop = this.state.offsetTop - bufferheight;
           console.log('Going up, new offset top will be : ' + nextState.offsetTop + ' ( ' + this.state.offsetTop + ',' + bufferheight + ')');

         } else if (nextState.direction === 'down') {

            var removeElements = this.props.children.slice(this.state.startIdx, nextState.startIdx);
            _.each(removeElements, function (el, idx) {
              var refName = "infinite-list-item" + idx;
              var el = this.refs[refName];

              console.log('Will remove item with index ' + idx);
              removeElementsHeight = removeElementsHeight + el.getDOMNode().offsetHeight;
            }, this);

            nextState.offsetTop = this.state.offsetTop  + removeElementsHeight;

            console.log('Going down, new offset top will be : ' + nextState.offsetTop + ' ( ' + this.state.offsetTop + ',' + removeElementsHeight + ')');
            console.log('New start idx will be ' + nextState.startIdx);
         }

         //offsetCorrection = (nextState.startIdx < this.state.startIdx) ? -bufferSize + removeElementsSize

         nextState.differential = false;
         nextState.direction = null;

         // Edges cases to be handled in a much cleaner way
         if (nextState.offsetTop < 0)  {
           return this.approximateInsertion(this.getScroll());
         }

        // Cleanup



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
            width:'100%',
            position:'relative'
          };

         positionningDivStyle = {
           top:  (this.state.offsetTop||0) + 'px',
           position:'absolute',
           width:'100%'
         };


         listSizerStyle = {
           height : this.state.listHeight
         };

         startIdx = this.state.startIdx;
         endIdx = this.state.endIdx;


         var renderedElements =  this.props.children.slice(startIdx,   endIdx);
         var bufferedElements =  this.props.children.slice(this.state.startBufferIdx||0, this.state.endBufferIdx||0);

         var infiniteChildren = _.map(renderedElements, function (ReactCpnt, idx) {
           var refName = "infinite-list-item" + idx;
           return (
            <InfiniteListItem rendered={true} key={ReactCpnt.key} ref={refName}>
              {ReactCpnt}
            </InfiniteListItem>
           );
         }, this);

         var bufferedElements =  _.map(bufferedElements, function (ReactCpnt, idx) {
           return (
            <InfiniteListItem rendered={true} key={ReactCpnt.key}>
              {ReactCpnt}
            </InfiniteListItem>
           );
         }, this);

         var bufferStyle = {
           position : 'absolute',
           top : '-10000px;',
           padding: '0',
           margin: '0',
           border: '0',
         };

         return (
           <div style={wrapperStyle}>
            <div style={listSizerStyle}>
              <div style={positionningDivStyle} ref="list-rendered">
                {infiniteChildren}
              </div>
            </div>
            <div style={bufferStyle} className="hidden-infinite-list-buffer" ref="buffered-elements">{bufferedElements}</div>
          </div>);
       },


      /*
      * Read the scroll position perodically to update display when neededed
      * Synchronise update with browser frames
      */
      keepDisplayInSync : function () {
        var instance_ = this;
        function repos() {
          nextFrame(function () {
            if (!instance_.isMounted()){ return; }

            instance_.rePositionList.call(instance_, instance_.getScroll());
          });
        }
        this.displaySyncInterval =  window.setInterval(repos, 1); // Get rid of those 50 ms ?
      },

      tearDownDisplayUpdate : function () {
        window.clearInterval(this.displaySyncInterval);
      },


      getScroll : function () {
        return window.document.body.scrollTop;
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
         var isGoingFlat = newScroll === this.oldScroll;

         var isBeforeTop = (newScroll < this.state.offsetTop);
         var isAfterBottom = ((newScroll + this.state.viewPortHeight) > this.state.offsetBottom);

         var hasReachedTopOfTheList = (this.state.startIdx == 0);
         var hasReachedBottomOfTheList = (this.state.endIdx == (this.props.children.length));

         this.oldScroll = newScroll;

         if ((isGoingUp || isGoingFlat) && hasReachedTopOfTheList && this.state.startIdx == 0) {
            return;
         }

         if ((isGoingDown || isGoingFlat) && hasReachedBottomOfTheList) {
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

           this.launchRenderingCycle('up', move);

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

               this.launchRenderingCycle('down', move);

            }
       },


       approximateInsertion: function (newScroll) {

          var fullLength, fullSize, startPosition, endPosition;

          fullLength = this.props.children.length;

          startPosition = Math.round((newScroll * fullLength) / this.getListFullHeight()) - 10;
          endPosition = Math.round(startPosition + 20);

          startPosition =  Math.max(0, startPosition);
          endPosition = Math.min(endPosition, fullLength);

          this.offsetTop = newScroll - this.state.viewPortHeight;
          this.offsetTop <= 0 ? (this.offsetTop = 0) : (this.offsetTop = this.offsetTop);

          this.setState({
            startIdx : startPosition,
            endIdx : endPosition,
            offsetTop : this.offsetTop,
            phase : 'rendering'
          });

       },

       /*
       *  From a move, compute the new position
       *  Measure the size of the newly added elements and recompute offset top
       *  Next rendering cycle will use that position, cache size in items when they are rendered
       */
       launchRenderingCycle : function (direction, move, newScroll) {

         var instance_, startRenderIdx, endRenderIdx, toRender, rendering, representativeHeight, nextStartIdx, nextEndIdx, marginStart;

        instance_ = this;
        representativeHeight = 0;

         if (direction === 'up') {

           // Compute new indexes
           nextStartIdx = this.state.startIdx - move;
           nextEndIdx = this.state.endIdx - move;

           startRenderIdx = this.state.startIdx - move;
           endRenderIdx = this.state.startIdx;


         } else if (direction === 'down') {

           nextStartIdx = this.state.startIdx + move;
           nextEndIdx = this.state.endIdx + move;

          // Compute new element that will be rendered
           startRenderIdx = this.state.endIdx;
           endRenderIdx = this.state.endIdx + move;

         }

         nextStartIdx = Math.round(nextStartIdx);
         nextEndIdx = Math.round(nextEndIdx);
         startRenderIdx = Math.round(startRenderIdx);
         endRenderIdx = Math.round(endRenderIdx);

         this.setState({
            startBufferIdx : startRenderIdx,
            endBufferIdx : endRenderIdx,
            buffering : true
         }, function () {
          // New items have been buffered, render new part of the list
           // TODO: debounce
           instance_.setState({
             startIdx : nextStartIdx,
             endIdx : nextEndIdx,
             differential : true,
             direction : direction
           });
         });

       }

   });



module.exports = InfiniteListComponent;


