const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const MealPlanItem = sequelize.define('MealPlanItem', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    mealPlanId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'meal_plan_id'
    },
    recipeId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'recipe_id'
    },
    mealName: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'meal_name'
    },
    mealDescription: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'meal_description'
    },
    calories: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    dayOfWeek: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'day_of_week',
      validate: {
        min: 0,
        max: 6
      }
    },
    mealType: {
      type: DataTypes.ENUM('breakfast', 'lunch', 'dinner', 'snack'),
      allowNull: false,
      field: 'meal_type'
    }
  }, {
    tableName: 'meal_plan_items',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  return MealPlanItem;
};
