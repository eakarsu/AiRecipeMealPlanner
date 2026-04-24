const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const GroceryOptimization = sequelize.define('GroceryOptimization', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    budget: {
      type: DataTypes.FLOAT,
      allowNull: true
    },
    storePreference: {
      type: DataTypes.STRING,
      allowNull: true
    },
    originalItems: {
      type: DataTypes.JSONB,
      defaultValue: []
    },
    optimizedItems: {
      type: DataTypes.JSONB,
      defaultValue: []
    },
    estimatedSavings: {
      type: DataTypes.FLOAT,
      defaultValue: 0
    },
    aiSuggestions: {
      type: DataTypes.JSONB,
      defaultValue: {}
    },
    status: {
      type: DataTypes.STRING,
      defaultValue: 'pending'
    }
  }, {
    tableName: 'grocery_optimizations',
    timestamps: true
  });

  return GroceryOptimization;
};
