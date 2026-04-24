const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const GroceryItem = sequelize.define('GroceryItem', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    groceryListId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'grocery_list_id'
    },
    ingredientId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'ingredient_id'
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    quantity: {
      type: DataTypes.FLOAT,
      allowNull: true
    },
    unit: {
      type: DataTypes.STRING,
      allowNull: true
    },
    checked: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  }, {
    tableName: 'grocery_items',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  return GroceryItem;
};
