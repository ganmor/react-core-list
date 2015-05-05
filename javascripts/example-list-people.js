define(['lib/jsx!lib/react-infinite-list'], function (ReactInfiniteList) {

  var Person =  React.createClass({

    componentWillMount : function () {
      this.color = this.props.element.id%2==0 ? '#cbcbcb' :'#e3eaee';
    },

    render : function () {

      var height = 75 + Math.random()* 40;

      return (<div className="item-line-style" style={{background:this.color, borderBottom:'1px solid silver'}}>
                <div>
                  <img src={this.props.element.picture} width="55"  style={{verticalAlign:'middle'}} />
                  <span style={{paddingLeft:'25px'}}><strong>{this.props.element.name} </strong> - {this.props.element.company}</span>
                  <div>{this.props.element.about}</div>
                </div>

              </div>);
    }
  });


  return React.createClass({

    render : function () {

      var elements = _.map(this.props.jsonList, function (element) {
        return (<Person element={element} key={element.id} />);
      });

      return (
				<div style={{height:window.innerHeight - 150+'px', overflow:'auto', WebkitOverflowScrolling:'touch'}}>
					<ReactInfiniteList>
						{elements}
					</ReactInfiniteList>
				</div>
      );

    }

  });

});
