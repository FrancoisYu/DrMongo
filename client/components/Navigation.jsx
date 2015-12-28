Navigation = React.createClass({

  mixins: [ReactMeteorData],

  getMeteorData() {
    let data = {};

    const env = this.props.currentEnvironment;
    const handle = Meteor.subscribe('navigationData', env.connectionId, env.databaseId);
    if (handle.ready()) {
      data.connections = Connections.find({}).fetch();

      if(env.connectionId) {
        data.databases = env.connection.databases();

        if(env.databaseId) {
          data.collections = env.database.collections();
        }
      }

      data.ready = true;
    }

    return data;
  },

  render() {
    return <div className="navbar navbar-default my-navbar db-theme">
      {this.data.ready ? this.renderNavigation() : <Loading />}
    </div>
  },

  renderNavigation() {
    const env = this.props.currentEnvironment;
    const selectedConnection = env.connectionId ? env.connection.name : 'Select connection';
    const selectedDatabase = env.databaseId ? env.database.name : 'Select database';
    const selectedCollection = env.collectionId ? env.collection.name : 'Select collection';

    return <div className="container">
      <div className="navbar-header">
        <button type="button" className="navbar-toggle collapsed"
                data-toggle="collapse"
                data-target="#bs-example-navbar-collapse-1"
                aria-expanded="false">
          <span className="sr-only">Toggle navigation</span>
          <span className="icon-bar" />
          <span className="icon-bar" />
          <span className="icon-bar" />
        </button>
        <a className="navbar-brand" href="/" title="Home / Connections">
          <i className="fa fa-heartbeat" /> Dr. Mongo
        </a>
      </div>
      <div className="collapse navbar-collapse" id="bs-example-navbar-collapse-1">
        <ul className="nav navbar-nav">
          <NavigationConnectionsDropdown selected={selectedConnection} items={this.data.connections} />
          {this.data.databases ? <NavigationDatabasesDropdown selected={selectedDatabase} items={this.data.databases} /> : null}
          {this.data.collections ? <NavigationCollectionsDropdown selected={selectedCollection} items={this.data.collections} /> : null}
        </ul>

        <Formsy.Form className="navbar-form navbar-right db-theme-form" onSubmit={this.handleSearchSubmit}>
          <div className="form-group">
            <MyInput className="form-control" name="text" type="text" placeholder="Search by _id" autoComplete="off" />
          </div>
          <button className="btn btn-default hidden" type="submit">Submit</button>
        </Formsy.Form>
      </div>
    </div>
  },

  handleSearchSubmit(values) {
    if (!resemblesId(values.text)) {
      sAlert.warning('Not an ID.');
      return false;
    }

    const databaseId = this.props.currentEnvironment.databaseId;

    Meteor.call('findCollectionForDocumentId', databaseId, values.text, (error, result) => {
      if (result === null) {
        sAlert.warning('Document not found.');
      }
      let c = Collections.findOne({database_id: databaseId, name: result});
      if (c) {
        const filterId = FilterHistory.insert({
          createdAt: new Date(),
          collection_id: c._id,
          name: null,
          filter: values.text
        });

        RouterUtils.redirect(RouterUtils.pathForDocuments(c, filterId))
      }
    });
  }
});


// -----------------------------------------------------------------------------
// -----------------------------------------------------------------------------

NavigationConnectionsDropdown = ({selected, items}) => (
  <li className="dropdown">
    <a href="#" className="dropdown-toggle" data-toggle="dropdown"
       role="button" aria-haspopup="true"
       aria-expanded="false" title="Select connection">
      {selected}
      <span className="caret" />
    </a>
    <ul className="dropdown-menu">
      {items.map((item) => (
        <li key={item._id}><a href={RouterUtils.pathForConnectionDashboard(item)}>{item.name}</a></li>
      ))}
    </ul>
  </li>
);

NavigationDatabasesDropdown = ({selected, items}) => (
  <li className="dropdown">
    <a href="#" className="dropdown-toggle" data-toggle="dropdown"
       role="button" aria-haspopup="true"
       aria-expanded="false" title="Select database">
      {selected}
      <span className="caret" />
    </a>
    <ul className="dropdown-menu">
      {items.map((item) => {
        const dbTheme = 'db-theme-' + item.theme + ' db-theme-inverted';
        return <li key={item._id}>
          <a className={dbTheme} href={RouterUtils.pathForDatabaseDashboard(item)}>{item.name}</a>
        </li>
      })}
    </ul>
  </li>
);

NavigationCollectionsDropdown = ({selected, items}) => (
  <li className="dropdown">
    <a href="#" className="dropdown-toggle" data-toggle="dropdown"
       role="button" aria-haspopup="true"
       aria-expanded="false" title="Select collection">
      {selected}
      <span className="caret" />
    </a>
    <ul className="dropdown-menu collection-dropdown">

      {items.map((collection) => {
        // const collectionIcon = collection.icon() + ' after';

        let savedFilters = FilterHistory.find({name: {$ne: null}, collection_id: collection._id}).fetch();

        if (savedFilters.length > 0) {
          var submenu = <ul className="dropdown-menu">
                {savedFilters.map((filterItem) => {
                  log(filterItem)
                  return <li className="menu-item"><a href={RouterUtils.pathForDocuments(collection, filterItem._id)}>{filterItem.name}</a></li>
                })}
              </ul>
        } else {
          var submenu = null;
        }

        return <li key={collection._id} className={submenu ? 'menu-item dropdown dropdown-submenu' : 'menu-item dropdown'}>
              <a href={RouterUtils.pathForDocuments(collection)} className={submenu ? 'dropdown-toggle' : ''} data-toggle={submenu ? 'dropdown' : ''} onClick={(event) => {FlowRouter.go(RouterUtils.pathForDocuments(collection)); return false;}}>
              <div className="relative text-nowrap z1">{collection.name}</div>
              </a>
              {submenu}
        </li>
      })}

      <li className="divider" />
      <li><a className="add-collection" href="#"><i className="fa fa-plus" /> Create collection @TODO</a></li>
    </ul>
  </li>
);