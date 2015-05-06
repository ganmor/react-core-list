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


function getScrollParent(target) {
	if (target === window) {
		return window;
	}

	for (var el = target; el; el = el.parentElement) {
		var overflowY = window.getComputedStyle(el).overflowY;
		if (overflowY === 'auto' || overflowY === 'scroll') { return el; }
	}
	return window;
}



var InfiniteListComponent = React.createClass({

	//
	// Life Cycle
	//

	componentDidMount : function () {
		this._configuration = _.extend(DEFAULTS, this.props.config);
		this.setState({
			initialOffsetTop : this.getDOMNode().offsetTop,
			viewPortHeight : (getWindowHeight() - 60 - this._configuration.MARGIN_BOTTOM),
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
			realSizes : {},
			oldScroll : 0
		};
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
		if (!nextState.differential) {
			nextState.startIdx = Math.max(0, nextState.startIdx);
			if (nextState.offsetTop > 0 && nextState.startIdx <= 0) {
				nextState.offsetTop = 0;
			}
			return;
		}

			// #1: Get buffer size
		bufferheight = this.refs['buffered-elements'].getDOMNode().offsetHeight;

		// #2: Get the remove elements height
		if (nextState.direction === 'up') {

		var removeElements = this.props.children.slice(nextState.endIdx, this.state.endIdx);
		_.each(removeElements, function (el, idx) {
			var refName = "infinite-list-item" + idx;
			el = this.refs[refName];
			try {
				removeElementsHeight = removeElementsHeight + el.getDOMNode().offsetHeight;
			} catch(e) {
				console.log(e);
			}
		}, this);

		nextState.offsetTop = this.state.offsetTop - bufferheight;
		// console.log('Going up, new offset top will be : ' + nextState.offsetTop + ' ( ' + this.state.offsetTop + ',' + bufferheight + ')');

		} else if (nextState.direction === 'down') {

		var removeElements = this.props.children.slice(this.state.startIdx, nextState.startIdx);
		_.each(removeElements, function (el, idx) {
			var refName = "infinite-list-item" + idx;
			el = this.refs[refName];

		 // console.log('Will remove item with index ' + idx);
			removeElementsHeight = removeElementsHeight + el.getDOMNode().offsetHeight;
		}, this);

		nextState.offsetTop = this.state.offsetTop  + removeElementsHeight;

		// console.log('Going down, new offset top will be : ' + nextState.offsetTop + ' ( ' + this.state.offsetTop + ',' + removeElementsHeight + ')');
		// console.log('New start idx will be ' + nextState.startIdx);
		}

		//offsetCorrection = (nextState.startIdx < this.state.startIdx) ? -bufferSize + removeElementsSize

		// Cleanup
		nextState.differential = false;
		nextState.direction = null;

		// Edges cases to be handled in a much cleaner way
		if (nextState.offsetTop < 0)  {
			return this.approximateInsertion(0);
		}

		nextState.startIdx = Math.max(0, nextState.startIdx);
		if (nextState.offsetTop > 0 && nextState.startIdx <= 0) {
			nextState.offsetTop = 0;
		}

	},

	componentDidUpdate : function (prevProps, prevState) {
		// Must result for next compare
		if (this.isMounted() && this.refs['list-rendered'] && this.refs['list-rendered'].getDOMNode()) {
			this.state.listRealHeight = this.refs['list-rendered'].getDOMNode().scrollHeight;
			this.state.offsetBottom = this.state.offsetTop + this.state.listRealHeight;
		}
	},

	render : function () {

		var wrapperStyle, positionningDivStyle, listSizerStyle, startIdx, endIdx, instance_;

		if (!this.state.viewPortHeight) { return (<div></div>); }

		instance_ = this;

		wrapperStyle = {
			width:'100%',
			position:'relative'
		};

		positionningDivStyle = {
			top:  (this.state.offsetTop||0) + 'px',
			position:'absolute',
			width:'100%',
			WebkitTransform:'translateZ(0)'
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
		getScrollParent(this.getDOMNode()).addEventListener('scroll', this.checkDisplay);
		getScrollParent(this.getDOMNode()).addEventListener('touchend', this.checkDisplay);
	},

	tearDownDisplayUpdate : function () {
		var instance_ = this;
		getScrollParent(this.getDOMNode()).removeEventListener('scroll', this.checkDisplay);
		getScrollParent(this.getDOMNode()).removeEventListener('touchend', this.checkDisplay);
	},

	checkDisplay : function () {
		var instance_ = this;
		if (!this.isMounted()){ return; }
		instance_.rePositionList.call(instance_, instance_.getScroll());
	},

	getScroll : function () {
		return getScrollParent(this.getDOMNode()).scrollTop;
	},

	getListFullHeight: function () {
		var fullLength = this.props.children.length;
		return (fullLength * this._configuration.DEFAULT_ITEM_HEIGHT) || 0;
	},

	//
	//  Real impl
	//
	rePositionList: function (newScroll) {

		var isGoingUp = newScroll < this.state.oldScroll;
		var isGoingDown = newScroll > this.state.oldScroll;
		var isGoingFlat = newScroll === this.state.oldScroll;



		var isBeforeTop = (newScroll < this.state.offsetTop);
		var isAfterBottom = ((newScroll + this.state.viewPortHeight) > this.state.offsetBottom);

		var hasReachedTopOfTheList = (this.state.startIdx == 0);
		var hasReachedBottomOfTheList = (this.state.endIdx >= (this.props.children.length));


		if ((isGoingUp || isGoingFlat) && hasReachedTopOfTheList) {
			return;
		}

		if ((isGoingDown || isGoingFlat) && hasReachedBottomOfTheList) {
			return;
		}


		if ( (isBeforeTop && isGoingUp) || (isAfterBottom && isGoingDown) ) {
			this.approximateInsertion(newScroll);
		} else if (isGoingDown) {
			this.repositionListDown(newScroll);
		} else if (isGoingUp) {
			this.repositionListUp(newScroll);
		}

	},

	repositionListUp: function (newScroll) {

		var targetOffsetTop, move, maxMove, shouldMove,  willReachTop, isTooCloseToBottom, instance_;

		instance_ = this;


		// Compute expected destination
		shouldMove = newScroll < (this.state.offsetTop + 2 * this._configuration.DEFAULT_ITEM_HEIGHT);
		targetOffsetTop = Math.max((newScroll - this._configuration.MARGIN_OUT_SCREEN), 0);

		// Compute the move
		move =  (this.state.offsetTop - targetOffsetTop) / this._configuration.DEFAULT_ITEM_HEIGHT;

		// Beginning of line
		willReachTop = (this.state.startIdx - move) <= 0;

		if (shouldMove || willReachTop) {
			move = Math.min(move, this.state.startIdx); // Easy one
			this.launchRenderingCycle('up', move);
		}

	},


	repositionListDown: function (newScroll) {

		var instance_, targetOffsetBottom, move, shouldMove, maxMove, isTooCloseToTop, willReachedBottom, maximumMove;

		instance_ = this;


		// Where list is supposed to end now
		targetOffsetBottom = newScroll + this.state.viewPortHeight + this._configuration.MARGIN_OUT_SCREEN;


		shouldMove = newScroll + this.state.viewPortHeight > this.state.offsetBottom - 2 * this._configuration.DEFAULT_ITEM_HEIGHT;

		move = (targetOffsetBottom - this.state.offsetBottom) / this._configuration.DEFAULT_ITEM_HEIGHT;

		maxMove = (newScroll - this.state.offsetTop) / this._configuration.DEFAULT_ITEM_HEIGHT;
		move = Math.min(maxMove, move);

		// Another move
		willReachedBottom = (this.state.endIdx + move) >= this.props.children.length;

		var notAllAreDisplayed = this.state.endIdx < this.props.children.length;

		if (shouldMove && notAllAreDisplayed) {

			 move = Math.min(move, (this.props.children.length) - this.state.endIdx);

			 this.launchRenderingCycle('down', move);

		}
	},


	approximateInsertion: function (newScroll) {

		var fullLength, fullSize, beginOffset, endOffset, startPosition, endPosition;
		var NB_MARGIN_TOP = 10;

		fullLength = this.props.children.length;


		beginOffset = Math.max(0, newScroll - this._configuration.MARGIN_OUT_SCREEN);

		startPosition = Math.round(beginOffset / this._configuration.DEFAULT_ITEM_HEIGHT);
		endPosition = Math.round(startPosition + ((this.state.viewPortHeight + 2 * this._configuration.MARGIN_OUT_SCREEN) / this._configuration.DEFAULT_ITEM_HEIGHT));

		startPosition =  Math.max(0, startPosition);
		endPosition = Math.min(endPosition, fullLength);

		var newOffsetTop =  startPosition * this._configuration.DEFAULT_ITEM_HEIGHT;

		newOffsetTop = (newOffsetTop <= 0) ? 0 : newOffsetTop;

		//	console.log('Approximate insertion to scroll ' + newScroll + 'new offset top will be ' + newOffsetTop + 'New start will be '  + startPosition);

		this.setState({
			startIdx : startPosition,
			endIdx : endPosition,
			offsetTop : newOffsetTop,
			phase : 'rendering',
			oldScroll : this.getScroll()
		});

	},

	/*
	*  From a move, compute the new position
	*  Measure the size of the newly added elements and recompute offset top
	*  Next rendering cycle will use that position, cache size in items when they are rendered
	*/
	launchRenderingCycle : function (direction, move, newScroll) {

		var instance_, startRenderIdx, endRenderIdx, toRender, rendering, representativeHeight, nextStartIdx, nextEndIdx, marginStart, oldScroll;

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

		oldScroll = this.getScroll();

		instance_.setState({
			startBufferIdx : startRenderIdx,
			endBufferIdx : endRenderIdx,
			buffering : true,
			oldScroll : oldScroll
		}, function () {
		// New items have been buffered, render new part of the list
		// TODO: debounce
			instance_.setState({
			 startIdx : nextStartIdx,
			 endIdx : nextEndIdx,
			 differential : true,
			 oldScroll : oldScroll,
			 direction : direction
			});
		});

	}

});



module.exports = InfiniteListComponent;


