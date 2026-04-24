const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const CookingTimer = sequelize.define('CookingTimer', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    recipeId: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    steps: {
      type: DataTypes.JSONB,
      defaultValue: []
    },
    totalTime: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    currentStep: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    status: {
      type: DataTypes.STRING,
      defaultValue: 'pending'
    },
    aiTimingAdvice: {
      type: DataTypes.JSONB,
      defaultValue: {}
    },
    notifications: {
      type: DataTypes.JSONB,
      defaultValue: []
    }
  }, {
    tableName: 'cooking_timers',
    timestamps: true
  });

  return CookingTimer;
};
