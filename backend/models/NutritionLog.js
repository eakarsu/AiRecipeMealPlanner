const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const NutritionLog = sequelize.define('NutritionLog', {
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
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    mealType: {
      type: DataTypes.ENUM('breakfast', 'lunch', 'dinner', 'snack'),
      allowNull: false,
      field: 'meal_type'
    },
    calories: {
      type: DataTypes.INTEGER,
      allowNull: true
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
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'nutrition_logs',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  return NutritionLog;
};
