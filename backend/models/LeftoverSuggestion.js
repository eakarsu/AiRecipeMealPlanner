const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const LeftoverSuggestion = sequelize.define('LeftoverSuggestion', {
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
    leftovers: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: []
    },
    expirationPriority: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    suggestedRecipes: {
      type: DataTypes.JSONB,
      defaultValue: []
    },
    aiRecommendations: {
      type: DataTypes.JSONB,
      defaultValue: {}
    },
    status: {
      type: DataTypes.STRING,
      defaultValue: 'pending'
    }
  }, {
    tableName: 'leftover_suggestions',
    timestamps: true
  });

  return LeftoverSuggestion;
};
