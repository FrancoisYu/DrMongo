Template.Menu.onCreated(function () {
});

Template.Menu.helpers({
  currentConnection() {
    return Connections.findOne(FlowRouter.getParam('connectionId'));
  },
  currentDatabase() {
    return Databases.findOne(FlowRouter.getParam('databaseId'));
  },
  connections() {
    return Connections.find({}, {sort: {name: 1}});
  },
  databases() {
    return Databases.find({}, {sort: {name: 1}});
  }
});

Template.Menu.events({
  'click #add-connection': function (e, t) {
    e.preventDefault();
    Connections.insert({
      name: 'New Connection',
      host: 'localhost',
      port: '27017'
    })
  }
});