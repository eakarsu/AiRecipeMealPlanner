const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const DietaryProfile = sequelize.define('DietaryProfile', {
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
    restrictions: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: []
    },
    allergies: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: []
    },
    preferences: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    targetCalories: {
      type: DataTypes.INTEGER,
      defaultValue: 2000
    },
    targetProtein: {
      type: DataTypes.FLOAT,
      defaultValue: 50
    },
    targetCarbs: {
      type: DataTypes.FLOAT,
      defaultValue: 250
    },
    targetFat: {
      type: DataTypes.FLOAT,
      defaultValue: 65
    },
    aiRecommendations: {
      type: DataTypes.JSONB,
      defaultValue: {}
    }
  }, {
    tableName: 'dietary_profiles',
    timestamps: true
  });

  return DietaryProfile;
};
