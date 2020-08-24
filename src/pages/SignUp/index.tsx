import React, {useCallback, useRef} from 'react';
import {
  Image,
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  Alert
}
from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import {useNavigation} from '@react-navigation/native';
import { Form } from '@unform/mobile';
import { FormHandles } from '@unform/core'
import * as Yup from 'yup';
import api from '../../services/api';

import getValidationErrors from '../../utils/getValidationErrors';
import Input from '../../components/Input';
import Button from '../../components/Button';

import logoImg from '../../assets/logo.png';

import {
  Container,
  Title,
  BackToSignInButton,
  BackToSignInButtonText
} from './styles';

interface SignUpFormData {
  name: string;
  email: string;
  password: string;
}
const SignUp: React.FC = () => {
  const formRef = useRef<FormHandles>(null);
  const navigation = useNavigation();

  const emailInputyRef = useRef<TextInput>(null)
  const passwordInputyRef = useRef<TextInput>(null)

   const handleSignUp = useCallback(
    async (data: SignUpFormData) => {
      // Validando
      try {
        formRef.current?.setErrors({});
        const schema = Yup.object().shape({
          name: Yup.string().required('Nome obrigatório'),
          email: Yup.string()
            .required('E-mail obrigatório')
            .email('Email inválido'),
          password: Yup.string().min(6, 'No minimo 6  digitos'),
        });
        await schema.validate(data, {
          abortEarly: false,
        });

        console.log(data);
        await api.post('/users', data);
        Alert.alert(
          'Cadastro realizado com sucesso!',
          'Você já pode fazer seu logon'
        )
        navigation.navigate('SignIn');
      } catch (err) {
        if (err instanceof Yup.ValidationError) {
          const errors = getValidationErrors(err);
          formRef.current?.setErrors(errors);
          return;
        }
        Alert.alert(
          'Error no cadastro :(',
          'Ocorreu um error ao fazer cadastro'
        )
      }
    },
    [navigation],
  );

  return (
    <>
    <KeyboardAvoidingView
    style={{ flex: 1 }}
    behavior={Platform.OS === 'ios' ? 'padding' : undefined }
    enabled
    >
    <ScrollView
    keyboardShouldPersistTaps="handled"
      contentContainerStyle={{ flex: 1}}
    >
      <Container>
        <Image source={logoImg} />
        <View>
          <Title>Crie sua conta</Title>
        </View>
        <Form ref={formRef} onSubmit={handleSignUp}>
        <Input
          autoCapitalize="words"
          name="name"
          icon="user"
          placeholder="Nome"
          returnKeyType="next"
          onSubmitEditing={()=> {
            emailInputyRef.current?.focus()
          }}
        />
        <Input
          ref={emailInputyRef}
          autoCorrect={false}
          autoCapitalize="none"
          keyboardType="email-address"
          name="email"
          icon="mail"
          placeholder="E-mail"
          returnKeyType="next"
          onSubmitEditing={()=> {
            passwordInputyRef.current?.focus()
          }}
        />
        <Input
          ref={passwordInputyRef}
          secureTextEntry
          textContentType="newPassword"
          name="password"
          icon="lock"
          placeholder="Senha"
          returnKeyType="send"
          onSubmitEditing={() => {
            formRef.current?.submitForm()
            }}
        />
        </Form>
        <Button onPress={() => {   formRef.current?.submitForm()}}>Cadastrar</Button>
    </Container>
  </ScrollView>
  </KeyboardAvoidingView>
    <BackToSignInButton onPress={() => {navigation.goBack()}}>
      <Icon name="arrow-left" size={20} color="#fff" />
      <BackToSignInButtonText>Voltar para o logon</BackToSignInButtonText>
    </BackToSignInButton>
    </>
  )
}

export default SignUp;


