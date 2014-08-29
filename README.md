#README

## How to install 42?

### Install node

- Go to http://nodejs.org, download the latest build and install it.

### Install mysql

- Go to http://dev.mysql.com/downloads/mysql/, download the latest build and install it.

### Install hbase

- Install Brew if you don't have it already: http://brew.sh
- Install the latest Java JDK: http://www.oracle.com/technetwork/java/javase/downloads/jdk8-downloads-2133151.html
- Install Hbase:

```
brew install hbase
```

- Start Hbase and Thrift

```
sudo hbase master start
sudo /usr/local/Cellar/hbase/0.98.4/bin/hbase-daemon.sh start thrift -f
```

### Initialize the service

- Setup database and dependencies:

```
sudo npm install --unsafe-perm
```

- Start Node

```
sudo nodemon server | bunyan
```