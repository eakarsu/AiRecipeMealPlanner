const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Recipe = sequelize.define('Recipe', {
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
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    instructions: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    prepTime: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'prep_time'
    },
    cookTime: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'cook_time'
    },
    servings: {
      type: DataTypes.INTEGER,
      allowNull: true
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
    imageUrl: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'image_url'
    },
    cuisine: {
      type: DataTypes.STRING,
      allowNull: true
    },
    categoryId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'category_id'
    }
  }, {
    tableName: 'recipes',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  return Recipe;
};
