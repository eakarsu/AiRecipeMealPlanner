const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const MealPlan = sequelize.define('MealPlan', {
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
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    startDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      field: 'start_date'
    },
    endDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      field: 'end_date'
    },
    targetCalories: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'target_calories'
    }
  }, {
    tableName: 'meal_plans',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  return MealPlan;
};
