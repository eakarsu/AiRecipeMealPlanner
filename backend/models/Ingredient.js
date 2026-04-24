const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Ingredient = sequelize.define('Ingredient', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    caloriesPer100g: {
      type: DataTypes.FLOAT,
      allowNull: true,
      field: 'calories_per_100g'
    },
    protein: {
      type: DataTypes.FLOAT,
      allowNull: true
    },
    carbs: {
      type: DataTypes.FLOAT,
      allowNull: true
    },
    fat: {
      type: DataTypes.FLOAT,
      allowNull: true
    },
    category: {
      type: DataTypes.STRING,
      allowNull: true
    }
  }, {
    tableName: 'ingredients',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  return Ingredient;
};
