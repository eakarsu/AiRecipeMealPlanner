const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const GroceryList = sequelize.define('GroceryList', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'user_id'
    },
    mealPlanId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'meal_plan_id'
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    }
  }, {
    tableName: 'grocery_lists',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  return GroceryList;
};
