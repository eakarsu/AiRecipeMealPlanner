const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const NutritionBalance = sequelize.define('NutritionBalance', {
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
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    currentIntake: {
      type: DataTypes.JSONB,
      defaultValue: {}
    },
    targetIntake: {
      type: DataTypes.JSONB,
      defaultValue: {}
    },
    balanceScore: {
      type: DataTypes.FLOAT,
      defaultValue: 0
    },
    deficiencies: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: []
    },
    excesses: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: []
    },
    aiRecommendations: {
      type: DataTypes.JSONB,
      defaultValue: {}
    }
  }, {
    tableName: 'nutrition_balances',
    timestamps: true
  });

  return NutritionBalance;
};
