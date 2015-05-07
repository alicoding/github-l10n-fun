var React = require('react/addons');
var ReactIntl = require('react-intl');
var Router = require('react-router');
var bs = require('react-bootstrap');

var auth = require('./auth');
var messages = require('val!./messages');

var LocalizedMsg = React.createClass({
  mixins: [ReactIntl.IntlMixin],
  render: function() {
    var message = this.getIntlMessage(this.props.msgid);

    return (
      <ReactIntl.FormattedMessage message={message} {...this.props} />
    );
  }
});

var App = React.createClass({
  mixins: [Router.Navigation, Router.State, ReactIntl.IntlMixin],
  handleLoginClick: function() {
    window.sessionStorage['pre_login_location'] = this.getPathname();
    auth.startLogin(this.makeHref('oauth2_callback'));
  },
  handleLogoutClick: function() {
    auth.logout();
    this.forceUpdate();
  },
  render: function() {
    var username = auth.getUsername();
    var loginBtn = username
      ? <bs.NavItem onClick={this.handleLogoutClick}>
          <LocalizedMsg msgid="logout" username={username}/>
        </bs.NavItem>
      : <bs.NavItem onClick={this.handleLoginClick}>
          <LocalizedMsg msgid="login"/>
        </bs.NavItem>;
    var brandLink = (
      <Router.Link to="/">
        <LocalizedMsg msgid="app_name"/>
      </Router.Link>
    );

    return (
      <div>
        <bs.Navbar staticTop brand={brandLink}>
          <bs.Nav right>
            {loginBtn}
          </bs.Nav>
        </bs.Navbar>
        <div className="container">
          <Router.RouteHandler/>
        </div>
      </div>
    );
  }
});

var NotFound = React.createClass({
  render: function() {
    return (
      <p>
        <LocalizedMsg msgid="not_found"/>
      </p>
    );
  }
});

var Home = React.createClass({
  render: function() {
    return <p>TODO: Fill this in.</p>;
  }
});

var CompleteLogin = React.createClass({
  mixins: [Router.State, Router.Navigation],
  getInitialState: function() {
    return {
      err: null
    };
  },
  componentDidMount: function() {
    var query = this.getQuery();
    var pathname = window.sessionStorage['pre_login_location'] || '/';
    delete window.sessionStorage['pre_login_location'];

    if (auth.getUsername()) {
      return this.transitionTo(pathname);
    }
    auth.completeLogin(query.code, query.state, function(err) {
      if (err) return  this.setState({err: err.message});
      this.transitionTo(pathname);
    }.bind(this));
  },
  render: function() {
    return (
      <div className="container">
        {this.state.err
         ? <p>An error occurred: {this.state.err}</p>
         : <p>Please wait, authenticating.</p>}
      </div>
    );
  }
});

var routes = (
  <Router.Route handler={App} path="/">
    <Router.DefaultRoute handler={Home}/>
    <Router.Route name="oauth2_callback" path="callback" handler={CompleteLogin}/>
    <Router.NotFoundRoute handler={NotFound}/>
  </Router.Route>
);

Router.run(routes, Router.HistoryLocation, function(Handler) {
  var locale = 'en-US';
  React.render(
    <Handler locales={[locale]} messages={messages[locale]} />,
    document.getElementById('app')
  );
});
