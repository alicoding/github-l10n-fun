var React = require('react/addons');
var Router = require('react-router');
var bs = require('react-bootstrap');

var PagedEntityStream = require('../../paged-entity-stream');

var Repo = React.createClass({
  mixins: [Router.State, Router.Navigation],
  getInitialState: function() {
    return {
      error: '',
      errorStatus: 0,
      defaultBranch: '',
      branches: []
    };
  },
  setError: function(msg, e) {
    this.setState({
      error: msg,
      errorStatus: e.status
    });
    console.log(e);
  },
  fetchBranches: function() {
    var params = this.getParams();
    var branches = [];
    var baseURL = '/repos/' + params.owner + '/' + params.repo;
    var githubRequest = this.props.githubRequest;

    // TODO: Handle error event.
    var stream = new PagedEntityStream({
      url: baseURL + '/branches',
      request: githubRequest
    }).on('data', function(branch) {
      branches.push(branch);
    }).on('error', function(e) {
      this.setError('Unable to fetch branch list.', e);
    }.bind(this)).on('end', function() {
      githubRequest('GET', baseURL).end(function(err, res) {
        if (err)
          return this.setError('Unable to fetch repository metadata.', err);
        // TODO: Test all kinds of edge cases here.
        this.setState({
          branches: branches,
          defaultBranch: res.body.default_branch,
          branch: this.state.branch || res.body.default_branch
        });
      }.bind(this));
    }.bind(this));
  },
  componentDidMount: function() {
    this.fetchBranches();
  },
  handleChangeBranch: function(e) {
    this.transitionTo(
      this.getPathname(),
      this.getParams(), _.extend(this.getQuery(), {
        branch: e.target.value
      })
    );
  },
  renderError: function(error, status) {
    return (
      <div className="alert alert-danger">
        <p>{this.state.error}</p>
        <p>GitHub returned <a target="_blank" href={
          "http://en.wikipedia.org/wiki/HTTP_" + status
        }>HTTP {status}</a>.</p>
        {!this.props.username ? <p>Logging in might help.</p> : null}
      </div>
    );
  },
  render: function() {
    var params = this.getParams();
    var query = this.getQuery();
    var branch = query.branch || this.state.defaultBranch;
    var isLoading = (this.state.defaultBranch === '');
    var content;

    if (this.state.error) {
      content = this.renderError(this.state.error, this.state.errorStatus);
    } else if (isLoading) {
      content = "Loading repository metadata...";
    } else {
      if (this.state.branches.indexOf(branch) == -1)
        branch = this.state.defaultBranch;
      content = (
        <div>
          <bs.Input type="select" label="Branch" className="input-sm" value={branch} onChange={this.handleChangeBranch}>
            {this.state.branches.map(function(branch) {
              return (
                <option key={branch.name} value={branch.name}>
                  {branch.name}
                </option>
              );
            })}
          </bs.Input>
          <Router.RouteHandler
           branch={branch}
           handleGithubError={this.setError}
           githubRequest={this.props.githubRequest} />
        </div>
      );
    }

    return (
      <div>
        <h1>{params.owner}/{params.repo}</h1>
        {content}
      </div>
    );
  }
});

module.exports = Repo;
