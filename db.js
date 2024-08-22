const {Sequelize} = require('sequelize') // це Node.js ORM взаємодіяти з реляційними базами даних, такими як MySQL, PostgreSQL, SQLite

module.exports = new Sequelize(
    luxe_lanedb,
    root,
    hwGTvoD9Usu6fGiLdMtiPtmmTwU2Xjk7,
    {
        dialect: 'postgres',
        host: 5432,
        port: 5432,
        // logging: false // відключає логування запитів
    }
)
