define(['lib/jsx!lib/react-infinite-list'], function (ReactInfiniteList) {

  var Person =  React.createClass({

    componentWillMount : function () {
      this.color = this.props.element.id%2==0 ? '#c0c0c0' :'rgb(253, 233, 233)';
    },

    render : function () {
      return (<div style={{background:this.color, height:'75px', marginBottom:'15px'}}>
              <img src={this.props.element.picture} width="55"/>
              {this.props.element.name} - <br /> {this.props.element.company}
              </div>);
    }
  });


  return React.createClass({

    render : function () {

      var elements = _.map(this.props.jsonList, function (element) {
        return (<Person element={element} key={element.id} />);
      });

      return (
        <ReactInfiniteList>
          {elements}
        </ReactInfiniteList>
      );

    }

  });

});
